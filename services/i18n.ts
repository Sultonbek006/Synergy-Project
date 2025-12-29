export type Language = 'en' | 'uz' | 'ru';

export const translations = {
    en: {
        // Auth & Common
        loginTitle: "Sign in to Synergy",
        email: "Email Address",
        password: "Password",
        loginButton: "Sign In",
        loggingIn: "Logging in...",
        logout: "Logout",
        search: "Search...",
        loading: "Loading...",
        error: "Error",
        success: "Success",

        // Sidebar
        dashboard: "Dashboard",
        selectCompany: "Select Company",

        // Manager Dashboard
        managerDashboard: "Manager Dashboard",
        loggedInAs: "Logged in as",
        region: "Region",
        groupAccess: "Group Access",
        yourTotalBudget: "Your Total Budget",
        doctorsInGroup: "Doctors in Group",
        paidTotalBudget: "Paid / Total Budget",
        remaining: "Remaining",

        // Verification Section
        paymentVerification: "Payment Verification (AI Forensic Scan)",
        selectDoctor: "Select Doctor",
        chooseDoctor: "-- Choose Doctor to Verify --",
        paymentMethod: "Payment Method",
        cardClick: "Card / Click",
        cashReceipt: "Cash / Receipt",
        uploadProof: "Upload Proof (Image/PDF)",
        verifyPayment: "Verify Payment with AI",
        analyzing: "Analyzing Receipt...",
        extractingData: "Extracting data from receipt...",
        connectingAI: "Connecting to Gemini Vision Model (Forensic Mode)",

        // Table
        yourTargetList: "Your Target List",
        filter: "Filter",
        noDoctorsFound: "No doctors found matching your Region and Group access.",
        expectedExcel: "Expected in Excel",

        // Table Headers
        colGroup: "Group",
        colDistrict: "District",
        colDoctor: "Doctor Name",
        colPhone: "Phone",
        colType: "Type",
        colTarget: "Target",
        colStatus: "Status",
        colRM: "RM Name",
        colWorkplace: "Workplace",
        colSpecialty: "Specialty",
        colPaid: "Paid Amount",
        colActions: "Actions",

        // Admin Dashboard
        adminDashboard: "Admin Dashboard",
        tabDashboard: "Dashboard",
        tabLiveView: "Live View",
        tabCorrection: "Correction",
        tabSetup: "Setup",

        // Admin Stats
        totalDoctors: "Total Doctors",
        totalTarget: "Total Target",
        totalCollected: "Total Collected",
        completion: "Completion",

        // Admin Setup
        importMasterPlan: "Import Master Plan",
        uploadExcel: "Upload Excel File",
        uploading: "Uploading...",
        uploadComplete: "Upload Complete",
        howItWorks: "How It Works",
        step1: "Select the company (Synergy, Amare, etc.)",
        step2: "Upload Excel file with strictly 8 columns (A-H).",
        step3: "Important: Ensure 'Group' column (Col G) contains EXACT values: A, B, C, or A2.",
        step4: "The system will automatically assign doctors to managers based on this Group letter.",
        simplifiedFormat: "Simplified 8-Column Format:\nA: Name, B: Region, C: District, D: Target Amount, E: Type, F: Phone, G: Group, H: RM Name",

        // Admin Correction
        correctData: "Data Correction & Manual Override",
        selectRegion: "Filter Region",
        selectGroup: "Filter Group",
        updateAmount: "Update Amount",
        updateStatus: "Update Status",
        adminComment: "Admin Comment (Optional)",
        saveChanges: "Save Changes",

        // Extra Admin
        adminCommandCenter: "Admin Command Center",
        monitorPerformance: "Monitor performance, audit evidence, and manage cycles.",
        outstandingDebt: "Outstanding Debt",
        managerPerformanceLeaderboard: "Manager Performance Leaderboard",
        sortedByDebt: "Sorted by Debt (Highest First)",
        liveManagerView: "Live Manager View",
        monthlyInitialization: "Monthly Initialization",
        selectTargetCompany: "1. Select Target Company",
        uploadMasterPlanLabel: "2. Upload Master Plan (Excel)",

        // Audit
        tabAudit: "🔎 Audit Evidence",
        noEvidence: "No Evidence Uploaded",
        evidenceImage: "Proof Image",
        viewEvidence: "View Evidence",
        warning: "Warning",
        uploadProofAction: "Upload"
    },

    uz: {
        // Auth & Common
        loginTitle: "Synergy Platformasiga kirish",
        email: "Email manzilur",
        password: "Parol",
        loginButton: "Kirish",
        loggingIn: "Kirilmoqda...",
        logout: "Chiqish",
        search: "Qidirish...",
        loading: "Yuklanmoqda...",
        error: "Xato",
        success: "Muvaffaqiyatli",

        // Sidebar
        dashboard: "Boshqaruv paneli",
        selectCompany: "Kompaniyani tanlang",

        // Manager Dashboard
        managerDashboard: "Menejer paneli",
        loggedInAs: "Foydalanuvchi",
        region: "Viloyat",
        groupAccess: "Guruh ruxsati",
        yourTotalBudget: "Sizning umumiy byudjetingiz",
        doctorsInGroup: "Guruhdagi shifokorlar",
        paidTotalBudget: "To'langan / Umumiy Byudjet",
        remaining: "Qoldiq",

        // Verification Section
        paymentVerification: "To'lovni tasdiqlash (AI Forensik tahlil)",
        selectDoctor: "Shifokorni tanlang",
        chooseDoctor: "-- Tasdiqlash uchun shifokorni tanlang --",
        paymentMethod: "To'lov usuli",
        cardClick: "Karta / Click",
        cashReceipt: "Naqd / Chek",
        uploadProof: "Isbotni yuklash (Rasm/PDF)",
        verifyPayment: "AI yordamida tekshirish",
        analyzing: "Chek tahlil qilinmoqda...",
        extractingData: "Chekdan ma'lumotlar olinmoqda...",
        connectingAI: "Gemini Vision Modeliga ulanish (Forensik rejim)",

        // Table
        yourTargetList: "Sizning maqsadli ro'yxatingiz",
        filter: "Filter",
        noDoctorsFound: "Sizning Viloyat va Guruhingizga mos shifokorlar topilmadi.",
        expectedExcel: "Excelda kutilgan",

        // Table Headers
        colGroup: "Guruh",
        colDistrict: "Tuman",
        colDoctor: "Shifokor ismi",
        colPhone: "Telefon",
        colType: "Tur",
        colTarget: "Maqsad (Plan)",
        colStatus: "Holat",
        colRM: "RM Ismi",
        colWorkplace: "Ish joyi",
        colSpecialty: "Mutaxassislik",
        colPaid: "To'langan summa",
        colActions: "Amallar",

        // Admin Dashboard
        adminDashboard: "Admin paneli",
        tabDashboard: "Statistika",
        tabLiveView: "Jonli ko'rininsh",
        tabCorrection: "Tahrirlash",
        tabSetup: "Sozlamalar",

        // Admin Stats
        totalDoctors: "Jami shifokorlar",
        totalTarget: "Umumiy reja",
        totalCollected: "Jami yig'ilgan",
        completion: "Bajarilishi",

        // Admin Setup
        importMasterPlan: "Master Planni yuklash",
        uploadExcel: "Excel faylni yuklash",
        uploading: "Yuklanmoqda...",
        uploadComplete: "Yuklash yakunlandi",
        howItWorks: "Bu qanday ishlaydi",
        step1: "Kompaniyani tanlang (Synergy, Amare va boshqalar)",
        step2: "Qat'iy 8 ustunli Excel faylini yuklang (A-H).",
        step3: "Muhim: 'Guruh' ustuni (Col G) aniq qiymatlarni o'z ichiga olishi kerak: A, B, C yoki A2.",
        step4: "Tizim shifokorlarni ushbu Guruh harfi asosida avtomatik ravishda menejerlarga biriktiradi.",
        simplifiedFormat: "Soddalashtirilgan 8 ustunli format:\nA: Ism, B: Viloyat, C: Tuman, D: Reja summasi, E: Tur, F: Telefon, G: Guruh, H: RM Ismi",

        // Admin Correction
        correctData: "Ma'lumotlarni tahrirlash",
        selectRegion: "Viloyatni tanlang",
        selectGroup: "Guruhni tanlang",
        updateAmount: "Summani yangilash",
        updateStatus: "Holatni yangilash",
        adminComment: "Admin izohi (ixtiyoriy)",
        saveChanges: "O'zgarishlarni saqlash",

        // Extra Admin
        adminCommandCenter: "Admin Boshqaruv Markazi",
        monitorPerformance: "Samaradorlikni, audit dalillarini va sikllarni boshqaring.",
        outstandingDebt: "Qolgan qarz",
        managerPerformanceLeaderboard: "Menejerlar reytingi",
        sortedByDebt: "Qarz bo'yicha saralangan (Eng ko'p)",
        liveManagerView: "Jonli menejer ko'rinishi",
        monthlyInitialization: "Oylik ishga tushirish",
        selectTargetCompany: "1. Maqsadli kompaniyani tanlang",
        uploadMasterPlanLabel: "2. Master Planni yuklash (Excel)",

        // Audit
        tabAudit: "🔎 Audit Dalillar",
        noEvidence: "Dalil yuklanmagan",
        evidenceImage: "Isbot rasmi",
        viewEvidence: "Dalilni ko'rish",
        warning: "Ogohlantirish",
        uploadProofAction: "Yuklash"
    },

    ru: {
        // Auth & Common
        loginTitle: "Вход в Synergy",
        email: "Email адрес",
        password: "Пароль",
        loginButton: "Войти",
        loggingIn: "Вход...",
        logout: "Выйти",
        search: "Поиск...",
        loading: "Загрузка...",
        error: "Ошибка",
        success: "Успешно",

        // Sidebar
        dashboard: "Дашборд",
        selectCompany: "Выберите компанию",

        // Manager Dashboard
        managerDashboard: "Панель менеджера",
        loggedInAs: "Вы вошли как",
        region: "Регион",
        groupAccess: "Доступ к группе",
        yourTotalBudget: "Ваш общий бюджет",
        doctorsInGroup: "Врачей в группе",
        paidTotalBudget: "Оплачено / Общий бюджет",
        remaining: "Остаток",

        // Verification Section
        paymentVerification: "Подтверждение оплаты (AI сканирование)",
        selectDoctor: "Выберите врача",
        chooseDoctor: "-- Выберите врача для проверки --",
        paymentMethod: "Метод оплаты",
        cardClick: "Карта / Click",
        cashReceipt: "Наличные / Чек",
        uploadProof: "Загрузить доказательство (Фото/PDF)",
        verifyPayment: "Проверить через AI",
        analyzing: "Анализ чека...",
        extractingData: "Извлечение данных из чека...",
        connectingAI: "Подключение к модели Gemini Vision (Forensic Mode)",

        // Table
        yourTargetList: "Ваш целевой список",
        filter: "Фильтр",
        noDoctorsFound: "Врачи, соответствующие вашему региону и группе, не найдены.",
        expectedExcel: "Ожидается в Excel",

        // Table Headers
        colGroup: "Группа",
        colDistrict: "Район",
        colDoctor: "ФИО Врача",
        colPhone: "Телефон",
        colType: "Тип",
        colTarget: "План (Сумма)",
        colStatus: "Статус",
        colRM: "Имя РМ",
        colWorkplace: "Место работы",
        colSpecialty: "Специальность",
        colPaid: "Оплачено",
        colActions: "Действия",

        // Admin Dashboard
        adminDashboard: "Панель администратора",
        tabDashboard: "Дашборд",
        tabLiveView: "Прямой эфир",
        tabCorrection: "Корректировка",
        tabSetup: "Настройка",

        // Admin Stats
        totalDoctors: "Всего врачей",
        totalTarget: "Общий план",
        totalCollected: "Всего собрано",
        completion: "Выполнение",

        // Admin Setup
        importMasterPlan: "Импорт мастер-плана",
        uploadExcel: "Загрузить Excel файл",
        uploading: "Загрузка...",
        uploadComplete: "Загрузка завершена",
        howItWorks: "Как это работает",
        step1: "Выберите компанию (Synergy, Amare и т.д.)",
        step2: "Загрузите файл Excel со строго 8 столбцами (A-H).",
        step3: "Важно: Столбец 'Группа' (Col G) должен содержать ТОЧНЫЕ значения: A, B, C или A2.",
        step4: "Система автоматически назначит врачей менеджерам на основе этой буквы группы.",
        simplifiedFormat: "Упрощенный формат из 8 столбцов:\nA: Имя, B: Регион, C: Район, D: Сумма плана, E: Тип, F: Телефон, G: Группа, H: Имя РМ",

        // Admin Correction
        correctData: "Корректировка данных",
        selectRegion: "Выберите регион",
        selectGroup: "Выберите группу",
        updateAmount: "Обновить сумму",
        updateStatus: "Обновить статус",
        adminComment: "Комментарий админа (необязательно)",
        saveChanges: "Сохранить изменения",

        // Extra Admin
        adminCommandCenter: "Центр управления администратора",
        monitorPerformance: "Мониторинг эффективности, аудит и управление циклами.",
        outstandingDebt: "Оставшийся долг",
        managerPerformanceLeaderboard: "Рейтинг эффективности менеджеров",
        sortedByDebt: "Сортировка по долгу (по убыванию)",
        liveManagerView: "Прямой просмотр менеджера",
        monthlyInitialization: "Ежемесячная инициализация",
        selectTargetCompany: "1. Выберите целевую компанию",
        uploadMasterPlanLabel: "2. Загрузить мастер-план (Excel)",

        // Audit
        tabAudit: "🔎 Аудит Доказательств",
        noEvidence: "Доказательства не загружены",
        evidenceImage: "Фото доказательство",
        viewEvidence: "Посмотреть доказательство",
        warning: "Предупреждение",
        uploadProofAction: "Загрузить"
    }
};
