from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base

# Enum for Company
class CompanyEnum(str, enum.Enum):
    SYNERGY = "Synergy"
    AMARE = "Amare"
    GALASSIYA = "Galassiya"
    PERFETTO = "Perfetto"

# Users Table
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'admin' or 'manager'
    company = Column(String, nullable=False)  # CompanyEnum value
    region = Column(String, nullable=True)  # e.g., 'SURXANDARYO'
    group_access = Column(String, nullable=True)  # e.g., 'AB', 'A2C', 'ALL', 'A'

# Master Plan Table (12-Column Structure)
class MasterPlan(Base):
    __tablename__ = "master_plan"
    
    id = Column(Integer, primary_key=True, index=True)
    company = Column(String, nullable=False)  # CompanyEnum value
    region = Column(String, nullable=False, index=True)  # Normalized Uppercase
    district = Column(String, nullable=True)
    group_name = Column(String, nullable=False, index=True)  # Group
    manager_name = Column(String, nullable=True)  # Regional Manager Name
    doctor_name = Column(String, nullable=False)
    specialty = Column(String, nullable=True)
    workplace = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    card_number = Column(String, nullable=True)
    target_amount = Column(Integer, nullable=False)
    planned_type = Column(String, nullable=False)  # 'Card' or 'Cash'
    month = Column(Integer, nullable=False)  # e.g., 10 for October
    status = Column(String, default="Pending")  # 'Pending', 'Verified', etc.
    
    # Relationship
    payments = relationship("Payment", back_populates="plan")

# Payments Table
class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("master_plan.id"), nullable=False)
    amount_paid = Column(Integer, nullable=False)
    proof_image_path = Column(String, nullable=True)  # Path to stored image
    payment_method = Column(String, nullable=False)  # 'Card/Click' or 'Cash/Paper'
    verified_at = Column(DateTime, default=datetime.utcnow)
    ai_log = Column(String, nullable=True)  # JSON dump of AI verification result
    transaction_id = Column(String, nullable=True, unique=True, index=True)  # Unique transaction ID for duplicate detection
    
    # Relationship
    plan = relationship("MasterPlan", back_populates="payments")
