"""
Synergy Platform - FastAPI Backend
Main application with Auth, Manager, and Admin routes
"""
import os
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Query, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai

from .database import get_db, engine, Base
from .models import User, MasterPlan, Payment
from .auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_current_admin,
    get_password_hash
)
from .services import process_excel_file

# Load environment variables
load_dotenv()

# Configure Gemini AI
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI
app = FastAPI(
    title="Synergy Platform API",
    description="Backend for Pharmaceutical Reconciliation Platform",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
UPLOADS_DIR = Path(__file__).parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory=str(UPLOADS_DIR)), name="static")


# ==================== PYDANTIC MODELS ====================

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    company: str
    region: Optional[str]
    group_access: Optional[str]

class DoctorResponse(BaseModel):
    id: int
    company: str
    region: str
    district: str
    group_name: str
    manager_name: str
    doctor_name: str
    specialty: str
    workplace: str
    phone: str
    card_number: str
    target_amount: int
    planned_type: str
    month: int
    status: str
    proof_image: Optional[str] = None
    amount_paid: Optional[int] = 0

class VerifyResponse(BaseModel):
    success: bool
    message: str
    extracted_amount: int
    new_status: str

class StatsResponse(BaseModel):
    total_doctors: int
    total_budget: int
    total_paid: int
    total_debt: int
    pending_count: int
    verified_count: int


# ==================== AUTH ROUTES ====================

@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login endpoint - returns JWT token"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user details"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        company=current_user.company,
        region=current_user.region,
        group_access=current_user.group_access
    )


# ==================== MANAGER ROUTES ====================

@app.get("/manager/doctors", response_model=List[DoctorResponse])
async def get_manager_doctors(
    month: Optional[int] = Query(None, description="Month filter (1-12)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get doctors assigned to current manager based on company, region, and group"""
    
    # Handle multi-region access (comma-separated regions)
    user_regions = [r.strip() for r in current_user.region.split(',')] if current_user.region else []
    
    # Base query
    query = db.query(MasterPlan).filter(
        MasterPlan.company == current_user.company
    )
    
    # Apply region filter (support multiple regions)
    if len(user_regions) == 1:
        query = query.filter(MasterPlan.region == user_regions[0])
    elif len(user_regions) > 1:
        query = query.filter(MasterPlan.region.in_(user_regions))
    
    # Apply month filter if provided
    if month:
        query = query.filter(MasterPlan.month == month)
    
    # ===== COMPANY-SPECIFIC GROUP LOGIC =====
    
    if current_user.company == 'Synergy':
        # Synergy: A, B, C, A2, B2, AB, A2C, A2CB2 groups
        if current_user.group_access == 'ALL':
            pass  # Return all (A, B, C, A2, B2)
        elif current_user.group_access == 'AB':
            query = query.filter(MasterPlan.group_name.in_(['A', 'B', 'AB']))
        elif current_user.group_access == 'A2C':
            query = query.filter(MasterPlan.group_name.in_(['A2', 'C', 'A2C']))
        elif current_user.group_access == 'A2CB2':
            # A2, C, and B2 combined access
            query = query.filter(MasterPlan.group_name.in_(['A2', 'C', 'A2C', 'B2']))
        elif current_user.group_access == 'B2':
            query = query.filter(MasterPlan.group_name == 'B2')
        else:
            query = query.filter(MasterPlan.group_name == current_user.group_access)
    
    elif current_user.company == 'Amare':
        # Amare: VITA, FORTE groups with district-based Toshkent
        if current_user.group_access == 'ALL':
            # Return all vita and forte
            query = query.filter(MasterPlan.group_name.in_(['VITA', 'FORTE']))
        elif current_user.group_access == 'VITA':
            query = query.filter(MasterPlan.group_name == 'VITA')
        elif current_user.group_access == 'FORTE':
            query = query.filter(MasterPlan.group_name == 'FORTE')
        elif current_user.group_access in ['VITA1', 'VITA2', 'FORTE1', 'FORTE2']:
            # Toshkent City district-based filtering
            # VITA1/FORTE1 districts: Бектемир, Қибрай, Мирзо Улуғбек, Миробод, Сирғали, Юнусобод, Янгиҳаёт, Яшнобод
            # VITA2/FORTE2 districts: Олмазор, Келес, Назарбек, Учтепа, Чилонзор, Шайхонтохур, Эшонгузар, Яккасарой
            
            # Use LIKE with wildcards to handle variations like "Келес шаҳри", "Назарбек шаҳарча", etc.
            districts_1 = ['Бектемир', 'Қибрай', 'Мирзо Улуғбек', 'Миробод', 'Сирғали', 'Юнусобод', 'Янгиҳаёт', 'Яшнобод']
            districts_2 = ['Олмазор', 'Келес', 'Назарбек', 'Учтепа', 'Чилонзор', 'Шайхонтохур', 'Эшонгузар', 'Яккасарой']
            
            if current_user.group_access == 'VITA1':
                query = query.filter(MasterPlan.group_name == 'VITA')
                # Use OR conditions with LIKE for case-insensitive partial matching
                district_conditions = [MasterPlan.district.like(f'%{d}%') for d in districts_1]
                query = query.filter(or_(*district_conditions))
            elif current_user.group_access == 'VITA2':
                query = query.filter(MasterPlan.group_name == 'VITA')
                district_conditions = [MasterPlan.district.like(f'%{d}%') for d in districts_2]
                query = query.filter(or_(*district_conditions))
            elif current_user.group_access == 'FORTE1':
                query = query.filter(MasterPlan.group_name == 'FORTE')
                district_conditions = [MasterPlan.district.like(f'%{d}%') for d in districts_1]
                query = query.filter(or_(*district_conditions))
            elif current_user.group_access == 'FORTE2':
                query = query.filter(MasterPlan.group_name == 'FORTE')
                district_conditions = [MasterPlan.district.like(f'%{d}%') for d in districts_2]
                query = query.filter(or_(*district_conditions))
        else:
            query = query.filter(MasterPlan.group_name == current_user.group_access)
    
    elif current_user.company == 'Galassiya':
        # Galassiya: NO groups - region-only filtering
        # Managers see ALL doctors in their assigned regions
        # No group filter applied - they see everything in the region
        pass
    
    elif current_user.company == 'Perfetto':
        # Perfetto: NO groups - region-only filtering (same as Galassiya)
        # Managers see ALL doctors in their assigned regions
        # No group filter applied - they see everything in the region
        pass
    
    else:
        # Default: exact match for other companies
        if current_user.group_access != 'ALL':
            query = query.filter(MasterPlan.group_name == current_user.group_access)
    
    doctors = query.all()
    
    return [
        DoctorResponse(
            id=d.id,
            company=d.company,
            region=d.region,
            district=d.district or '',
            group_name=d.group_name,
            manager_name=d.manager_name or '',
            doctor_name=d.doctor_name,
            specialty=d.specialty or '',
            workplace=d.workplace or '',
            phone=d.phone or '',
            card_number=d.card_number or '',
            target_amount=d.target_amount,
            planned_type=d.planned_type,
            month=d.month,
            status=d.status,
            proof_image=sorted(d.payments, key=lambda x: x.verified_at or datetime.min, reverse=True)[0].proof_image_path if d.payments else None,
            amount_paid=sorted(d.payments, key=lambda x: x.verified_at or datetime.min, reverse=True)[0].amount_paid if d.payments else 0
        )
        for d in doctors
    ]

# Helper function for saving files
async def save_proof_file(file: UploadFile, plan: MasterPlan) -> str:
    """Save uploaded proof file and return relative path"""
    year_month = datetime.now().strftime("%Y_%m")
    safe_group = re.sub(r'[^a-zA-Z0-9]', '_', plan.group_name)
    safe_region = re.sub(r'[^a-zA-Z0-9]', '_', plan.region)
    
    upload_path = UPLOADS_DIR / plan.company / safe_region / safe_group / year_month
    upload_path.mkdir(parents=True, exist_ok=True)
    
    # Generate safe filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = re.sub(r'[^a-zA-Z0-9]', '_', plan.doctor_name)[:30]
    file_ext = Path(file.filename).suffix or '.jpg'
    filename = f"{safe_name}_{timestamp}{file_ext}"
    file_path = upload_path / filename
    
    # Save file
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
        
    # Keep file cursor at start for further reading if needed
    await file.seek(0)
    
    return str(file_path.relative_to(UPLOADS_DIR))


@app.post("/manager/verify", response_model=VerifyResponse)
async def verify_payment(
    file: UploadFile = File(...),
    plan_id: int = Form(...),
    payment_method: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify payment using Forensic AI"""
    
    # Get the plan item
    plan = db.query(MasterPlan).filter(MasterPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Verify user has access to this plan
    if plan.company != current_user.company or plan.region != current_user.region:
        raise HTTPException(status_code=403, detail="Access denied to this plan")
    
    # ===== STEP A: Storage Strategy =====
    relative_path = await save_proof_file(file, plan)
    
    # Read content again for AI (since save_proof_file reset cursor)
    content = await file.read()
    
    # ===== STEP B: Forensic AI Prompt =====
    try:
        import base64
        
        # Prepare image for Gemini
        base64_image = base64.b64encode(content).decode('utf-8')
        mime_type = file.content_type or 'image/jpeg'
        
        # Build the forensic prompt
        mode = "Cash/Paper" if payment_method.lower() == "cash" else "Card/Click"
        
        # Month names for prompt
        month_names = {
            1: 'January', 2: 'February', 3: 'March', 4: 'April',
            5: 'May', 6: 'June', 7: 'July', 8: 'August',
            9: 'September', 10: 'October', 11: 'November', 12: 'December'
        }
        expected_month_name = month_names.get(plan.month, 'Unknown')
        
        # Determine Currency and Rules
        is_dollar_plan = False
        if plan.planned_type and ('dollar' in plan.planned_type.lower() or 'usd' in plan.planned_type.lower()):
            is_dollar_plan = True
            currency_label = "USD (Dollars)"
            
            # DOLLAR SPECIFIC RULES
            amount_logic = """
6. **AMOUNT EXTRACTION (DOLLAR MODE - CRITICAL)**:
   - This is a DOLLAR ($) Transaction.
   - Expected Amount is around: $ {plan.target_amount}
   
   **WHERE TO LOOK FOR AMOUNT (check ALL of these fields):**
   - "Рекомендация:" (Recommendation) - PRIMARY location
   - "Количество:" (Quantity) - SECONDARY location, often shows numbers like "3000 МЛ"
   - "Подпись:" (Signature area) - sometimes amount is written near signature
   - "Сумма:" (Sum) - if present
   
   - The written amount is usually the EXACT number (e.g., "50", "150", "200").
   - DO NOT multiply by 1000.
   - DO NOT treat as thousands.
   - Extract the exact numeric value found.
"""
        else:
            is_dollar_plan = False
            currency_label = "UZS (So'm)"
            
            # UZS SPECIFIC RULES
            amount_logic = """
6. **AMOUNT EXTRACTION (UZS MODE - CRITICAL)**:
   - This is a UZS (Sum) Transaction.
   - Expected Amount is around: {plan.target_amount:,} UZS
   
   **WHERE TO LOOK FOR AMOUNT (check ALL of these fields - IMPORTANT!):**
   - "Рекомендация:" (Recommendation) - PRIMARY location
   - "Количество:" (Quantity) - SECONDARY location, often shows numbers like "3000 МЛ" or "3000"
   - "Подпись:" (Signature area) - sometimes amount is written near signature
   - "Сумма:" (Sum) - if present
   
   **IMPORTANT**: If "Количество" shows something like "3000 МЛ" or "3000", this IS the amount!
   Ignore "МЛ" (milliliters label) - extract just the number.
   
   **SMART CONVERSION LOGIC (Paper Checks)**:
    Doctors write numbers in different ways. You must deduce the intent based on the Expected Amount ({plan.target_amount:,}).
   
   If you find a small number like "100", "50", "200", "3000":
   
   A) **Standard Shorthand (x 1,000)**:
      * "100" means 100,000 UZS.
      * "500" means 500,000 UZS.
      * "3000" means 3,000,000 UZS (3 million).
      * USE THIS IF: (Found Value * 1000) is close to Expected Amount.
   
   B) **Dollar-to-Sum Conversion (x 12,000)**:
      * Sometimes "100$" or just "100" means 100 DOLLARS worth of Sum.
      * Rate: 1 USD ≈ 12,000 UZS.
      * "100" or "100$" -> 1,200,000 UZS.
      * "50" or "50$" -> 600,000 UZS.
      * USE THIS IF: (Found Value * 12000) is close to Expected Amount.
   
   **DECISION RULES:**
   - "100" with Expected ~100,000 -> Result is 100,000.
   - "100" with Expected ~1,200,000 -> Result is 1,200,000.
   - "3000" with Expected ~3,000,000 -> Result is 3,000,000.
   - "50" with Expected ~50,000 -> Result is 50,000.
   - "50" with Expected ~600,000 -> Result is 600,000.
   
   ALWAYS return the calculated UZS value (e.g. 3000000), not the small number.
"""

        forensic_prompt = f"""
ROLE: Senior Forensic Auditor. Verify this Uzbek payment receipt (РЕЦЕПТ).

CONTEXT:
- Expected Doctor Name: "{plan.doctor_name}"
- Expected Phone: "{plan.phone}"
- Expected Amount: {plan.target_amount}
- Payment Mode: {mode}
- Expected Currency: {currency_label}
- Expected Month: {expected_month_name} ({plan.month})

CRITICAL RULES:

1. **PHONE NUMBER EXTRACTION (HIGHEST PRIORITY)**:
   - CAREFULLY look for phone numbers near "Телефон:", "Tel:", "Phone:" or similar labels
   - Uzbek phone formats: (XX) XXX XXXX, +998XXXXXXXXX, 8X XXX XXXX, 9X XXX XXXX
   - EXTRACT ALL DIGITS you can read, even if partially unclear
   - Common prefixes: 80, 90, 91, 93, 94, 95, 97, 98, 99, 88, 33, 71
   - If you see something like "(80) 903 9992" or "80 903 9992", extract as "809039992"
   - IGNORE spaces, dashes, parentheses - just get the digits
   - Put the raw digits in extracted_phone field
   - **ALSO extract the LAST 4 READABLE DIGITS separately** into `extracted_phone_last4` field
   - Even if the full number is messy, try to read at least the last 4 digits clearly

2. **IDENTITY VERIFICATION (SOFT MATCHING FOR MESSY HANDWRITING)**:
   - Doctor handwriting is often messy. Use this SOFT matching approach:
   
   **MATCH PRIORITY (in order):**
   a) FULL PHONE MATCH: Compare extracted phone with expected phone "{plan.phone}"
      - Normalize both: remove +998, spaces, dashes, parentheses
      - Match if last 9 digits are the same → identity_match = true
   
   b) LAST 4 DIGITS FALLBACK: If full phone is unclear/doesn't match:
      - Compare the last 4 digits of extracted_phone_last4 with the last 4 digits of "{plan.phone}"
      - If they match → identity_match = true, set `last4_matched = true`
      - This is for receipts where most of the number is messy but the last 4 are readable
   
   c) NAME MATCH: If phone methods don't work:
      - Fuzzy match the name (Latin/Cyrillic interchangeable)
      - Partial matches OK: "Саид" matches "Саидова"
      - If name matches → identity_match = true
   
   **FINAL RULE**: If ANY of the above (full phone, last 4 digits, OR name) matches → identity_match = true

3. **NAME EXTRACTION (SECONDARY)**:
   - Look for name near "Ф.И.О врача:", "ФИО:", "Врач:", "Shifokor:"
   - Handwritten names may be hard to read - extract what you can
   - Latin/Cyrillic interchangeable (e.g., "Саидова" = "Saidova")
   - Partial matches are OK: "Саид" matches "Саидова"

4. DATE VALIDATION (EXTREMELY LENIENT for Handwriting):
   - CRITICAL: Doctors have messy handwriting. Do NOT be strict.
   - If the date lines have ANY ink, scribbles, or marks -> set `has_complete_date = true`.
   - ONLY return `has_complete_date = false` if the lines are COMPLETELY BLANK (empty underscores with no writing).
   - MONTH MATCHING:
     * If the month is written clearly, extract it.
     * If the month is MESSY, AMBIGUOUS, or hard to read (e.g., looks like "11", "II", "//", "N", or just a scribble), ASSUME it matches the Expected Month ({plan.month})!
     * Set `extracted_month = {plan.month}` if there is any doubt.

5. AUTHENTICITY CHECK (for Cash/Paper receipts only):
   - If payment mode is "Cash/Paper":
     * Look for handwritten SIGNATURE near 'Imzo', 'Подпись'
     * Look for official INK STAMP (blue/purple circle with text/logo)
     * If signature found -> has_signature = true, else false
     * If stamp found -> has_stamp = true, else false
     * If EITHER signature OR stamp found -> is_authentic = true
     * If BOTH are missing -> is_authentic = false
   - If payment mode is "Card/Click":
     * Signature and stamp are NOT required
     * Set has_signature = true, has_stamp = true, is_authentic = true (bypass check)

{amount_logic}

7. TRANSACTION ID EXTRACTION (for duplicate detection):
   - Look for "ID транзакции", "Transaction ID", "Чек №", "Check #", or similar fields
   - Extract the full numeric/alphanumeric transaction identifier
   - Common locations: near bottom of receipt, labeled as ID, Transaction, or Check number
   - If found, include in extracted_transaction_id field

OUTPUT STRICTLY AS JSON (no markdown, no explanation):
{{
    "extracted_name": "name found on receipt (even if unclear)",
    "extracted_phone": "all phone digits you can read (e.g. 809039992)",
    "extracted_phone_last4": "last 4 readable digits of phone (e.g. 9992)",
    "extracted_amount": 500000,
    "extracted_month": 11,
    "extracted_transaction_id": "290022691",
    "has_complete_date": true,
    "has_signature": true,
    "has_stamp": true,
    "is_authentic": true,
    "identity_match": true,
    "phone_matched": true,
    "last4_matched": false,
    "name_matched": false,
    "confidence": 0.95,
    "reason": "Brief explanation of how identity was verified (full phone, last 4 digits, or name)"
}}
"""
        
        # Call Gemini
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content([
            {"mime_type": mime_type, "data": base64_image},
            forensic_prompt
        ])
        
        # Parse response
        response_text = response.text.strip()
        # Clean markdown if present
        if response_text.startswith('```'):
            response_text = re.sub(r'^```json?\s*', '', response_text)
            response_text = re.sub(r'\s*```$', '', response_text)
        
        ai_result = json.loads(response_text)
        
    except Exception as e:
        # AI failed - log and continue with manual review flag
        ai_result = {
            "extracted_amount": 0,
            "extracted_month": None,
            "is_authentic": None,
            "identity_match": None,
            "error": str(e)
        }
    
    # ===== STEP C: Gatekeeper Logic =====
    
    # Rule 1: Month and Year Required (for all payment types)
    if ai_result.get("has_complete_date") is False:
        raise HTTPException(
            status_code=400,
            detail="❌ REJECTED: Month Missing. The receipt must specify at least the Month and Year. Blank date lines are not allowed."
        )
    
    # Rules 2-4: Signature OR Stamp Required (ONLY for Cash/Paper receipts)
    if payment_method.lower() == "cash":
        # Rule 2-3 Combined: At least ONE of signature or stamp must be present
        # Use flexible truthy check (not strict `is True`) to handle various AI response formats
        has_signature_val = ai_result.get("has_signature")
        has_stamp_val = ai_result.get("has_stamp")
        
        # Consider it present if value is True, "true", 1, or any truthy value (but not False/None/"false")
        has_signature = has_signature_val is True or has_signature_val == "true" or has_signature_val == 1
        has_stamp = has_stamp_val is True or has_stamp_val == "true" or has_stamp_val == 1
        
        # Also check: if AI explicitly said False, it's definitely not present
        # If AI returned None or didn't include the field, we're more lenient
        signature_explicitly_false = has_signature_val is False or has_signature_val == "false"
        stamp_explicitly_false = has_stamp_val is False or has_stamp_val == "false"
        
        # Only reject if BOTH are explicitly false or missing
        if (signature_explicitly_false or has_signature_val is None) and (stamp_explicitly_false or has_stamp_val is None):
            # Double check - if at least one has a truthy value, don't reject
            if not has_signature and not has_stamp:
                raise HTTPException(
                    status_code=400,
                    detail="❌ REJECTED: No Authentication. Paper receipts must have at least a signature OR a stamp for verification."
                )
        
        # If we have at least one, consider it authentic
        # (Removed the strict requirement for both signature AND stamp)
    
    # Rule 5: Month validation (use plan's actual month) - for all payment types
    extracted_month = ai_result.get("extracted_month")
    if extracted_month is not None and extracted_month != plan.month:
        month_names = {
            1: 'January', 2: 'February', 3: 'March', 4: 'April',
            5: 'May', 6: 'June', 7: 'July', 8: 'August',
            9: 'September', 10: 'October', 11: 'November', 12: 'December'
        }
        expected_name = month_names.get(plan.month, str(plan.month))
        raise HTTPException(
            status_code=400,
            detail=f"❌ REJECTED: Wrong Month. Found {extracted_month or 'nothing'}, expected {expected_name} ({plan.month})."
        )
    
    # Rule 6: Identity match - for all payment types
    if ai_result.get("identity_match") is False:
        raise HTTPException(
            status_code=400,
            detail="❌ REJECTED: Identity Mismatch. Could not verify Doctor Name or Phone."
        )
    
    # Rule 7: Duplicate Transaction Check (CRITICAL)
    extracted_transaction_id = ai_result.get("extracted_transaction_id")
    if extracted_transaction_id:
        # Check if this transaction ID was already used
        existing_payment = db.query(Payment).filter(
            Payment.transaction_id == str(extracted_transaction_id)
        ).first()
        if existing_payment:
            # Find the plan associated with the existing payment
            existing_plan = db.query(MasterPlan).filter(MasterPlan.id == existing_payment.plan_id).first()
            doctor_info = existing_plan.doctor_name if existing_plan else "Unknown"
            raise HTTPException(
                status_code=400,
                detail=f"❌ REJECTED: Duplicate Receipt. This transaction ID ({extracted_transaction_id}) was already used for doctor: {doctor_info}. Each receipt can only be submitted once."
            )
    
    # ===== STEP D: Database Update =====
    
    extracted_amount = ai_result.get("extracted_amount", 0)
    difference = plan.target_amount - extracted_amount
    
    # Determine status
    if difference == 0:
        new_status = "✅ Verified"
    elif difference > 0:
        new_status = f"⚠️ Underpaid (Debt: {difference:,} UZS)"
    else:
        new_status = f"⚠️ Overpaid (+{abs(difference):,} UZS)"
    
    # Create payment record with transaction_id for duplicate detection
    payment = Payment(
        plan_id=plan.id,
        amount_paid=extracted_amount,
        proof_image_path=relative_path,
        payment_method=payment_method,
        verified_at=datetime.utcnow(),
        ai_log=json.dumps(ai_result),
        transaction_id=str(extracted_transaction_id) if extracted_transaction_id else None
    )
    db.add(payment)
    
    # Update plan status
    plan.status = new_status
    db.commit()
    
    return VerifyResponse(
        success=True,
        message=f"Payment verified: {extracted_amount:,} UZS",
        extracted_amount=extracted_amount,
        new_status=new_status
    )


# ==================== ADMIN ROUTES ====================

@app.post("/admin/upload-plan")
async def upload_plan(
    file: UploadFile = File(...),
    company_name: str = Form(...),
    month: int = Form(12),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Upload Excel file to populate master_plan table"""
    
    # Read file content
    content = await file.read()
    
    # Process Excel
    result = process_excel_file(content, company_name, db, month)
    
    if not result['success']:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to process file: {result['errors']}"
        )
    
    return {
        "success": True,
        "message": f"Successfully imported {result['inserted_count']} records",
        "inserted_count": result['inserted_count'],
        "errors": result['errors']
    }


@app.get("/admin/stats", response_model=StatsResponse)
async def get_admin_stats(
    company: Optional[str] = None,
    region: Optional[str] = None,
    month: Optional[int] = Query(None, description="Month filter (1-12)"),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get statistics for admin dashboard"""
    
    # Base query
    query = db.query(MasterPlan)
    
    # Apply filters
    if company:
        query = query.filter(MasterPlan.company == company)
    if region:
        query = query.filter(MasterPlan.region == region)
    if month:
        query = query.filter(MasterPlan.month == month)
    
    plans = query.all()
    
    # Calculate stats
    total_doctors = len(plans)
    total_budget = sum(p.target_amount for p in plans)
    
    # Get total paid from payments
    plan_ids = [p.id for p in plans]
    if plan_ids:
        total_paid = db.query(func.sum(Payment.amount_paid)).filter(
            Payment.plan_id.in_(plan_ids)
        ).scalar() or 0
    else:
        total_paid = 0
    
    total_debt = total_budget - total_paid
    pending_count = len([p for p in plans if p.status == 'Pending'])
    verified_count = len([p for p in plans if '✅' in p.status])
    
    return StatsResponse(
        total_doctors=total_doctors,
        total_budget=total_budget,
        total_paid=total_paid,
        total_debt=total_debt if total_debt > 0 else 0,
        pending_count=pending_count,
        verified_count=verified_count
    )


@app.get("/admin/users")
async def get_all_users(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "role": u.role,
            "company": u.company,
            "region": u.region,
            "group_access": u.group_access
        }
        for u in users
    ]


@app.get("/admin/data", response_model=List[DoctorResponse])
async def get_admin_data(
    company: str = Query(..., description="Company name (required)"),
    region: Optional[str] = Query(None, description="Region filter"),
    group: Optional[str] = Query(None, description="Group filter"),
    doctor_name: Optional[str] = Query(None, description="Doctor name filter (partial match)"),
    month: Optional[int] = Query(None, description="Month filter (1-12)"),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Flexible search endpoint for admin audit and live view.
    Returns MasterPlan rows with payment status and proof info.
    """
    query = db.query(MasterPlan).filter(MasterPlan.company == company)
    if region:
        query = query.filter(MasterPlan.region == region)
    if group:
        query = query.filter(MasterPlan.group_name == group)
    if doctor_name:
        query = query.filter(MasterPlan.doctor_name.ilike(f"%{doctor_name}%"))
    if month:
        query = query.filter(MasterPlan.month == month)
    plans = query.all()
    result = []
    for p in plans:
        result.append(
            DoctorResponse(
                id=p.id,
                company=p.company,
                region=p.region,
                district=p.district or "",
                group_name=p.group_name,
                manager_name=p.manager_name or "",
                doctor_name=p.doctor_name,
                specialty=p.specialty or "",
                workplace=p.workplace or "",
                phone=p.phone or "",
                card_number=p.card_number or "",
                target_amount=p.target_amount,
                planned_type=p.planned_type,
                month=p.month,
                status=p.status,
                proof_image=sorted(p.payments, key=lambda x: x.verified_at or datetime.min, reverse=True)[0].proof_image_path if p.payments else None,
                amount_paid=sorted(p.payments, key=lambda x: x.verified_at or datetime.min, reverse=True)[0].amount_paid if p.payments else 0
            )
        )
    return result


@app.get("/admin/leaderboard")
async def get_leaderboard(
    company: str = Query(..., description="Company name"),
    month: Optional[int] = Query(None, description="Month filter (1-12)"),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get manager leaderboard grouped by region and group"""
    query = db.query(MasterPlan).filter(MasterPlan.company == company)
    if month:
        query = query.filter(MasterPlan.month == month)
    plans = query.all()
    
    # Group by region and group_name
    leaderboard = {}
    for p in plans:
        key = f"{p.region}_{p.group_name}"
        if key not in leaderboard:
            leaderboard[key] = {
                "region": p.region,
                "group_name": p.group_name,
                "target": 0,
                "paid": 0,
                "debt": 0
            }
        leaderboard[key]["target"] += p.target_amount
    
    # Get payments for each plan
    plan_ids = [p.id for p in plans]
    if plan_ids:
        payments = db.query(Payment).filter(Payment.plan_id.in_(plan_ids)).all()
        payment_map = {}
        for payment in payments:
            if payment.plan_id not in payment_map:
                payment_map[payment.plan_id] = 0
            payment_map[payment.plan_id] += payment.amount_paid
        
        # Calculate paid amounts
        for p in plans:
            key = f"{p.region}_{p.group_name}"
            if p.id in payment_map:
                leaderboard[key]["paid"] += payment_map[p.id]
    
    # Calculate debt
    for key in leaderboard:
        leaderboard[key]["debt"] = leaderboard[key]["target"] - leaderboard[key]["paid"]
    
    # Sort by debt (highest first)
    result = sorted(leaderboard.values(), key=lambda x: x["debt"], reverse=True)
    return result


@app.put("/admin/update-payment/{plan_id}")
async def update_payment(
    plan_id: int,
    amount_paid: int = Form(...),
    status: str = Form(...),
    admin_comment: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update payment amount and status for a plan (admin override)"""
    plan = db.query(MasterPlan).filter(MasterPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Create or update payment record
    payment = db.query(Payment).filter(Payment.plan_id == plan_id).first()
    
    relative_path = None
    if file:
        relative_path = await save_proof_file(file, plan)
        
    if not payment:
        payment = Payment(
            plan_id=plan_id,
            amount_paid=amount_paid,
            payment_method="Manual/Admin",
            verified_at=datetime.utcnow(),
            proof_image_path=relative_path, # Set image if uploaded
            ai_log=json.dumps({"manual_override": True, "admin_comment": admin_comment})
        )
        db.add(payment)
    else:
        payment.amount_paid = amount_paid
        payment.verified_at = datetime.utcnow()
        if relative_path:
            payment.proof_image_path = relative_path # Update image if uploaded
        if admin_comment:
            try:
                log = json.loads(payment.ai_log or "{}")
            except:
                log = {}
            log["admin_correction"] = admin_comment
            payment.ai_log = json.dumps(log)
    
    # Update plan status
    plan.status = status
    
    # If file is uploaded, force status to Verified if not manually set to something else? 
    # User said: "Automatically mark status as Verified".
    # But admin receives 'status' from the form dropdown. 
    # If the user selects a status, we should respect it. But usually Admin will select "Verified".
    # If file provided, we assume Verified unless specified. 
    # But since 'status' is required in Form, frontend will send it.
    
    db.commit()
    
    return {"success": True, "message": "Payment updated", "new_status": status}




# ==================== HEALTH CHECK ====================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "app": "Synergy Platform API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "gemini_configured": bool(GOOGLE_API_KEY)
    }
