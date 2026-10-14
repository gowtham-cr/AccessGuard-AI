/**
 * Comprehensive bilingual content and step-by-step guidance for Karnataka public digital services.
 * Accurate Kannada translations tailored for senior citizens, rural residents, and individuals with disabilities.
 */

export const CITIZEN_SERVICES = [
  {
    id: 'ration-card',
    category: 'food',
    icon: 'Wheat',
    en: {
      title: 'Ration Card & Food Security Services',
      department: 'Department of Food, Civil Supplies & Consumer Affairs',
      shortDesc: 'Apply for new BPL/AAY ration cards, add family members, or check quota status.',
      helpline: 'Toll-Free: 1967 or 1800-425-9333',
      documentsRequired: [
        'Aadhaar card of all family members',
        'Income certificate issued by Tahsildar (for BPL eligibility)',
        'Electricity bill or domicile certificate as proof of residence',
        'Passport-sized photograph of family head',
      ],
      steps: [
        {
          step: 1,
          title: 'Prepare Required Documents',
          instruction: 'Ensure all family members have their Aadhaar cards linked with their mobile numbers for OTP authentication.',
        },
        {
          step: 2,
          title: 'Visit the Official Food Portal or Grama One',
          instruction: 'Open the official Karnataka Food portal (ahara.kar.nic.in) or visit your nearest Grama One / Karnataka One center.',
        },
        {
          step: 3,
          title: 'Submit Application & Biometrics',
          instruction: 'Select "E-Services" -> "New Ration Card" -> "BPL / APL". Enter the Aadhaar numbers and complete biometric verification.',
        },
        {
          step: 4,
          title: 'Keep Acknowledgment Number',
          instruction: 'Note down the 12-digit acknowledgment number to track dispatch through your local fair price shop (FPS).',
        },
      ],
      warnings: [
        'Do not pay unauthorized middlemen. The official government fee at Grama One is nominal.',
        'Never share your bank OTP or Aadhaar OTP with anyone calling on phone claiming to be food officials.',
      ],
      officialUrl: 'https://ahara.kar.nic.in',
    },
    kn: {
      title: 'ಪಡಿತರ ಚೀಟಿ ಮತ್ತು ಆಹಾರ ಭದ್ರತೆ ಸೇವೆಗಳು',
      department: 'ಆಹಾರ, ನಾಗರಿಕ ಸರಬರಾಜು ಮತ್ತು ಗ್ರಾಹಕರ ವ್ಯವಹಾರಗಳ ಇಲಾಖೆ',
      shortDesc: 'ಹೊಸ ಬಿಪಿಎಲ್/ಎಎವೈ ಪಡಿತರ ಚೀಟಿಗಾಗಿ ಅರ್ಜಿ, ಸದಸ್ಯರ ಸೇರ್ಪಡೆ ಅಥವಾ ಧಾನ್ಯದ ವಿವರ ಪರಿಶೀಲನೆ.',
      helpline: 'ಉಚಿತ ಸಹಾಯವಾಣಿ: 1967 ಅಥವಾ 1800-425-9333',
      documentsRequired: [
        'ಕುಟುಂಬದ ಎಲ್ಲಾ ಸದಸ್ಯರ ಆಧಾರ್ ಕಾರ್ಡ್ ಪ್ರತಿಗಳು',
        'ತಹಸೀಲ್ದಾರ್ ರವರಿಂದ ಪಡೆದ ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ (ಬಿಪಿಎಲ್ ಅರ್ಹತೆಗಾಗಿ)',
        'ವಿಳಾಸ ದೃಢೀಕರಣಕ್ಕಾಗಿ ಇತ್ತೀಚಿನ ವಿದ್ಯುತ್ ಬಿಲ್ ಅಥವಾ ವಾಸಸ್ಥಳ ದೃಢೀಕರಣ',
        'ಕುಟುಂಬದ ಮುಖ್ಯಸ್ಥರ ಪಾಸ್‌ಪೋರ್ಟ್ ಅಳತೆಯ ಭಾವಚಿತ್ರ',
      ],
      steps: [
        {
          step: 1,
          title: 'ಅಗತ್ಯ ದಾಖಲೆಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಿಕೊಳ್ಳಿ',
          instruction: 'ಎಲ್ಲಾ ಕುಟುಂಬ ಸದಸ್ಯರ ಆಧಾರ್ ಕಾರ್ಡ್‌ಗೆ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಲಿಂಕ್ ಆಗಿರುವುದನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.',
        },
        {
          step: 2,
          title: 'ಅಧಿಕೃತ ಆಹಾರ ಪೋರ್ಟಲ್ ಅಥವಾ ಗ್ರಾಮ ಒನ್ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ',
          instruction: 'ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ ahara.kar.nic.in ತೆರೆಯಿರಿ ಅಥವಾ ನಿಮ್ಮ ಹತ್ತಿರದ ಗ್ರಾಮ ಒನ್ / ಕರ್ನಾಟಕ ಒನ್ ಕೇಂದ್ರಕ್ಕೆ ಹೋಗಿ.',
        },
        {
          step: 3,
          title: 'ಅರ್ಜಿ ನಮೂನೆ ಭರ್ತಿ ಮತ್ತು ದೃಢೀಕರಣ',
          instruction: '"ಇ-ಸೇವೆಗಳು" -> "ಹೊಸ ಪಡಿತರ ಚೀಟಿ" ಆಯ್ಕೆಮಾಡಿ, ವಿವರ ನಮೂದಿಸಿ ಮತ್ತು ಬಯೋಮೆಟ್ರಿಕ್/ಒಟಿಪಿ ದೃಢೀಕರಣ ಪೂರ್ಣಗೊಳಿಸಿ.',
        },
        {
          step: 4,
          title: 'ಸ್ವೀಕೃತಿ ಸಂಖ್ಯೆಯನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಇರಿಸಿ',
          instruction: 'ಅರ್ಜಿಯ ಸ್ಥಿತಿಯನ್ನು ತಿಳಿಯಲು ನಿಮ್ಮ 12 ಅಂಕಿಯ ಸ್ವೀಕೃತಿ ರಸೀದಿಯನ್ನು ಜೋಪಾನವಾಗಿ ಇಟ್ಟುಕೊಳ್ಳಿ.',
        },
      ],
      warnings: [
        'ಯಾವುದೇ ದಲ್ಲಾಳಿಗಳಿಗೆ ಹಣ ನೀಡಬೇಡಿ. ಗ್ರಾಮ ಒನ್ ಕೇಂದ್ರಗಳಲ್ಲಿ ನಿಗದಿತ ಸೇವಾ ಶುಲ್ಕ ಮಾತ್ರ ಇರುತ್ತದೆ.',
        'ಅಧಿಕಾರಿಗಳ ಹೆಸರಿನಲ್ಲಿ ಬರುವ ಅಪರಿಚಿತ ಕರೆಗಳಿಗೆ ನಿಮ್ಮ ಮೊಬೈಲ್ ಒಟಿಪಿ ಅಥವಾ ಬ್ಯಾಂಕ್ ವಿವರ ನೀಡಬೇಡಿ.',
      ],
      officialUrl: 'https://ahara.kar.nic.in',
    },
  },
  {
    id: 'bhoomi-land',
    category: 'land',
    icon: 'MapPin',
    en: {
      title: 'Bhoomi: Land Records & Pahani (RTC)',
      department: 'Revenue Department, Government of Karnataka',
      shortDesc: 'View RTC/Pahani, check mutation status, and download digitally signed land records.',
      helpline: 'Bhoomi Helpline: 080-22113255',
      documentsRequired: [
        'District, Taluk, Hobli, and Village name',
        'Survey Number, Hissa Number, and Surnoc Number',
        'Mobile number for receiving SMS alerts',
      ],
      steps: [
        {
          step: 1,
          title: 'Navigate to Bhoomi Portal',
          instruction: 'Visit the official Karnataka Bhoomi portal (bhoomojankari.karnataka.gov.in).',
        },
        {
          step: 2,
          title: 'Select Your Location Hierarchy',
          instruction: 'Choose your District -> Taluk -> Hobli -> Village from the dropdown menus.',
        },
        {
          step: 3,
          title: 'Enter Survey Number & Period',
          instruction: 'Input your Survey Number and click "Go". Select the Hissa and Surnoc numbers matching your land.',
        },
        {
          step: 4,
          title: 'View & Download Signed RTC',
          instruction: 'Click "Fetch Details" followed by "View RTC". You can review land ownership, crops, and soil classification.',
        },
      ],
      warnings: [
        'Ensure the downloaded document contains the official QR code and digital signature.',
        'Always verify mutation extract (Hakkupatra) before entering into any land agreements.',
      ],
      officialUrl: 'https://bhoomojankari.karnataka.gov.in',
    },
    kn: {
      title: 'ಭೂಮಿ: ಪಹಣಿ ಮತ್ತು ಕಂದಾಯ ಭೂದಾಖಲೆಗಳು (RTC)',
      department: 'ಕಂದಾಯ ಇಲಾಖೆ, ಕರ್ನಾಟಕ ಸರ್ಕಾರ',
      shortDesc: 'ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ನಿಮ್ಮ ಜಮೀನಿನ ಪಹಣಿ (RTC) ವೀಕ್ಷಣೆ, ಮ್ಯುಟೇಷನ್ ಸ್ಥಿತಿ ಮತ್ತು ಡಿಜಿಟಲ್ ಸಹಿ ದಾಖಲೆ ಪಡೆದುಕೊಳ್ಳಿ.',
      helpline: 'ಭೂಮಿ ಸಹಾಯವಾಣಿ: 080-22113255',
      documentsRequired: [
        'ಜಿಲ್ಲೆ, ತಾಲೂಕು, ಹೋಬಳಿ ಮತ್ತು ಗ್ರಾಮದ ನಿಖರವಾದ ಹೆಸರು',
        'ಸರ್ವೆ ನಂಬರ್, ಹಿಸ್ಸಾ ನಂಬರ್ ಮತ್ತು ಸುರ್ನೋಕ್ ಸಂಖ್ಯೆ',
        'ಮಾಹಿತಿ ಪಡೆಯಲು ಸಕ್ರಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
      ],
      steps: [
        {
          step: 1,
          title: 'ಅಧಿಕೃತ ಭೂಮಿ ಪೋರ್ಟಲ್‌ಗೆ ಭೇಟಿ ನೀಡಿ',
          instruction: 'ಸರ್ಕಾರದ ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ bhoomojankari.karnataka.gov.in ತೆರೆಯಿರಿ.',
        },
        {
          step: 2,
          title: 'ನಿಮ್ಮ ಊರು ಮತ್ತು ತಾಲೂಕು ಆಯ್ಕೆಮಾಡಿ',
          instruction: 'ಡ್ರಾಪ್‌ಡೌನ್ ಪಟ್ಟಿಯಲ್ಲಿ ನಿಮ್ಮ ಜಿಲ್ಲೆ, ತಾಲೂಕು, ಹೋಬಳಿ ಮತ್ತು ಗ್ರಾಮವನ್ನು ಗುರುತಿಸಿ.',
        },
        {
          step: 3,
          title: 'ಸರ್ವೆ ನಂಬರ್ ಮತ್ತು ಹಿಸ್ಸಾ ನಮೂದಿಸಿ',
          instruction: 'ನಿಮ್ಮ ಜಮೀನಿನ ಸರ್ವೆ ನಂಬರ್ ನಮೂದಿಸಿ "Fetch" ಕ್ಲಿಕ್ ಮಾಡಿ, ಸರಿಯಾದ ಹಿಸ್ಸಾ ಆಯ್ಕೆಮಾಡಿ.',
        },
        {
          step: 4,
          title: 'ಪಹಣಿ (RTC) ವೀಕ್ಷಿಸಿ ಮತ್ತು ಪ್ರಿಂಟ್ ಪಡೆಯಿರಿ',
          instruction: '"View RTC" ಮೇಲೆ ಒತ್ತಿ ಮಾಲೀಕರ ಹೆಸರು, ವಿಸ್ತೀರ್ಣ ಮತ್ತು ಕಂದಾಯ ವಿವರಗಳನ್ನು ತಾಳೆ ನೋಡಿ.',
        },
      ],
      warnings: [
        'ಡೌನ್‌ಲೋಡ್ ಮಾಡಿದ ಪಹಣಿಯಲ್ಲಿ ಕ್ಯೂಆರ್ ಕೋಡ್ ಮತ್ತು ಸರ್ಕಾರದ ಡಿಜಿಟಲ್ ಸಹಿ ಇರುವುದನ್ನು ಪರಿಶೀಲಿಸಿ.',
        'ಖರೀದಿ ಅಥವಾ ಮಾರಾಟದ ಮುನ್ನ ಮ್ಯುಟೇಷನ್ ದಾಖಲೆ (ಹಕ್ಕುಪತ್ರ) ನಕಲನ್ನು ಪರಿಶೀಲಿಸುವುದು ಕಡ್ಡಾಯ.',
      ],
      officialUrl: 'https://bhoomojankari.karnataka.gov.in',
    },
  },
  {
    id: 'senior-pension',
    category: 'pension',
    icon: 'HeartHandshake',
    en: {
      title: 'Senior Citizen Pension (Sandhya Suraksha)',
      department: 'Social Security and Pensions Directorate',
      shortDesc: 'Monthly financial assistance for seniors aged 65 and above from low-income families.',
      helpline: 'Elder Line: 14567 or Janasnehi: 080-22231200',
      documentsRequired: [
        'Age proof (Voter ID, School certificate, or Medical Officer certificate showing 65+ years)',
        'Annual family income certificate below ₹32,000 (rural) or ₹40,000 (urban)',
        'Active bank passbook or Post Office savings account with IFSC',
        'Aadhaar card with biometric linkage',
      ],
      steps: [
        {
          step: 1,
          title: 'Collect Proof of Age and Income',
          instruction: 'Get your income verification done at Nadakacheri or Atalji Janasnehi Kendra.',
        },
        {
          step: 2,
          title: 'Apply through Seva Sindhu or Grama One',
          instruction: 'Visit your local Grama One or apply online at sevasindhu.karnataka.gov.in under Social Security schemes.',
        },
        {
          step: 3,
          title: 'Verification by Revenue Inspector',
          instruction: 'Village Accountant or Revenue Inspector will verify residence and age eligibility.',
        },
        {
          step: 4,
          title: 'Direct Benefit Transfer (DBT)',
          instruction: 'Once approved by Tahsildar, monthly pension of ₹1,200 is credited directly to your bank account.',
        },
      ],
      warnings: [
        'There is no fee for senior citizen pension sanction. Do not pay bribes.',
        'Submit annual Jeevan Pramaan (digital life certificate) in November to keep pension active.',
      ],
      officialUrl: 'https://sevasindhu.karnataka.gov.in',
    },
    kn: {
      title: 'ಹಿರಿಯ ನಾಗರಿಕರ ಸಂಧ್ಯಾ ಸುರಕ್ಷಾ ಪಿಂಚಣಿ ಯೋಜನೆ',
      department: 'ಸಾಮಾಜಿಕ ಭದ್ರತೆ ಮತ್ತು ಪಿಂಚಣಿಗಳ ನಿರ್ದೇಶನಾಲಯ',
      shortDesc: '೬೫ ವರ್ಷ ಮತ್ತು ಮೇಲ್ಪಟ್ಟ ಅರ್ಹ ಬಡ ಹಿರಿಯ ನಾಗರಿಕರಿಗೆ ಮಾಸಿಕ ಆರ್ಥಿಕ ನೆರವು.',
      helpline: 'ಹಿರಿಯ ನಾಗರಿಕರ ಸಹಾಯವಾಣಿ: 14567 ಅಥವಾ ಜನಸ್ನೇಹಿ: 080-22231200',
      documentsRequired: [
        'ವಯಸ್ಸಿನ ಪುರಾವೆ (ಮತದಾರರ ಗುರುತಿನ ಚೀಟಿ ಅಥವಾ ಸರ್ಕಾರಿ ವೈದ್ಯರ ಪ್ರಮಾಣಪತ್ರ - ೬೫+ ವರ್ಷ)',
        'ಗ್ರಾಮೀಣ ಭಾಗಕ್ಕೆ ವಾರ್ಷಿಕ ಆದಾಯ ₹೩೨,೦೦೦ ಕ್ಕಿಂತ ಕಡಿಮೆ ಇರುವ ಪ್ರಮಾಣಪತ್ರ',
        'ಬ್ಯಾಂಕ್ ಅಥವಾ ಪೋಸ್ಟ್ ಆಫೀಸ್ ಉಳಿತಾಯ ಖಾತೆ ಪಾಸ್‌ಬುಕ್ ಪ್ರತಿ',
        'ಆಧಾರ್ ಕಾರ್ಡ್ ಪ್ರತಿ',
      ],
      steps: [
        {
          step: 1,
          title: 'ವಯಸ್ಸು ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ ಸಂಗ್ರಹಿಸಿ',
          instruction: 'ನಾಡಕಚೇರಿ ಅಥವಾ ಅಟಲ್ ಜಿ ಜನಸ್ನೇಹಿ ಕೇಂದ್ರದ ಮೂಲಕ ನಿಮ್ಮ ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ ಪಡೆದುಕೊಳ್ಳಿ.',
        },
        {
          step: 2,
          title: 'ಸೇವಾ ಸಿಂಧು ಅಥವಾ ಗ್ರಾಮ ಒನ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ',
          instruction: 'ನಿಮ್ಮ ಊರಿನ ಗ್ರಾಮ ಒನ್ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ ಸಂಧ್ಯಾ ಸುರಕ್ಷಾ ಯೋಜನೆಗೆ ಅರ್ಜಿ ನಮೂನೆ ಭರ್ತಿ ಮಾಡಿ.',
        },
        {
          step: 3,
          title: 'ಕಂದಾಯ ನಿರೀಕ್ಷಕರ ಸ್ಥಳ ಪರಿಶೀಲನೆ',
          instruction: 'ಗ್ರಾಮ ಆಡಳಿತಾಧಿಕಾರಿಗಳು ಮತ್ತು ಕಂದಾಯ ನಿರೀಕ್ಷಕರು ನಿಮ್ಮ ವಾಸಸ್ಥಳದ ಪರಿಶೀಲನೆ ನಡೆಸುತ್ತಾರೆ.',
        },
        {
          step: 4,
          title: 'ನೇರ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಜಮೆ (DBT)',
          instruction: 'ತಹಸೀಲ್ದಾರ್ ಅನುಮೋದನೆ ನೀಡಿದ ನಂತರ, ಮಾಸಿಕ ₹೧,೨೦೦ ಪಿಂಚಣಿ ಹಣ ನೇರವಾಗಿ ನಿಮ್ಮ ಖಾತೆಗೆ ಜಮೆಯಾಗುತ್ತದೆ.',
        },
      ],
      warnings: [
        'ಪಿಂಚಣಿ ಮಂಜೂರಾತಿಗಾಗಿ ಯಾರಾದರೂ ಹಣ ಕೇಳಿದರೆ ದೂರು ನೀಡಿ. ಯಾವುದೇ ಮಧ್ಯವರ್ತಿಗಳಿಗೆ ಹಣ ನೀಡಬೇಡಿ.',
        'ಪಿಂಚಣಿ ಮುಂದುವರಿಯಲು ಪ್ರತಿ ವರ್ಷ ನವೆಂಬರ್ ತಿಂಗಳಲ್ಲಿ ಜೀವನ್ ಪ್ರಮಾಣಪತ್ರ (Life Certificate) ನವೀಕರಿಸಿ.',
      ],
      officialUrl: 'https://sevasindhu.karnataka.gov.in',
    },
  },
  {
    id: 'disability-udid',
    category: 'disability',
    icon: 'Accessibility',
    en: {
      title: 'Disability Certificate & Unique Disability ID (UDID)',
      department: 'Department for Empowerment of Persons with Disabilities',
      shortDesc: 'Apply for official disability identity card to access government welfare, travel concessions, and reservations.',
      helpline: 'Disability Helpline: 1800-180-5129',
      documentsRequired: [
        'Recent color passport photograph (showing disability clearly if visible)',
        'Aadhaar card or voter ID for identity proof',
        'Address proof (Ration card / Electricity bill)',
        'Previous hospital treatment records or clinical diagnosis (if available)',
      ],
      steps: [
        {
          step: 1,
          title: 'Register on Swavlamban Card Portal',
          instruction: 'Open swavlambancard.gov.in and click "Apply for Disability Certificate & UDID Card".',
        },
        {
          step: 2,
          title: 'Upload Documents and Medical History',
          instruction: 'Enter personal details, disability type (locomotor, visual, hearing, intellectual, etc.), and upload photo and ID.',
        },
        {
          step: 3,
          title: 'Visit District Medical Board for Assessment',
          instruction: 'Attend the assigned government district hospital on your appointment date for clinical evaluation.',
        },
        {
          step: 4,
          title: 'Receive Digital UDID Card',
          instruction: 'Download your e-UDID card online with the QR code. The laminated physical card is delivered by post.',
        },
      ],
      warnings: [
        'Medical assessment is conducted free of charge at all government district civil hospitals.',
        'Ensure the certificate specifies permanent or temporary disability percentage.',
      ],
      officialUrl: 'https://www.swavlambancard.gov.in',
    },
    kn: {
      title: 'ಅಂಗವಿಕಲರ ವಿಶಿಷ್ಟ ಗುರುತಿನ ಚೀಟಿ (UDID ಕಾರ್ಡ್)',
      department: 'ವಿಶೇಷ ಚೇತನರ ಹಾಗೂ ಹಿರಿಯ ನಾಗರಿಕರ ಸಬಲೀಕರಣ ಇಲಾಖೆ',
      shortDesc: 'ಸರ್ಕಾರಿ ಸೌಲಭ್ಯಗಳು, ಬಸ್/ರೈಲ್ವೆ ರಿಯಾಯಿತಿ ಮತ್ತು ಮಾಸಾಶನಕ್ಕಾಗಿ ಡಿಜಿಟಲ್ ಅಂಗವಿಕಲತಾ ಪ್ರಮಾಣಪತ್ರ.',
      helpline: 'ವಿಶೇಷ ಚೇತನರ ಸಹಾಯವಾಣಿ: 1800-180-5129',
      documentsRequired: [
        'ಇತ್ತೀಚಿನ ಪಾಸ್‌ಪೋರ್ಟ್ ಅಳತೆಯ ಬಣ್ಣದ ಭಾವಚಿತ್ರ (ಅಂಗವಿಕಲತೆ ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣುವಂತೆ)',
        'ಆಧಾರ್ ಕಾರ್ಡ್ ಅಥವಾ ಮತದಾರರ ಗುರುತಿನ ಚೀಟಿ',
        'ವಿಳಾಸ ದೃಢೀಕರಣ ಪತ್ರ (ಪಡಿತರ ಚೀಟಿ / ವಿದ್ಯುತ್ ಬಿಲ್)',
        'ಹಿಂದಿನ ಆಸ್ಪತ್ರೆ ಚಿಕಿತ್ಸಾ ದಾಖಲೆಗಳು (ಲಭ್ಯವಿದ್ದಲ್ಲಿ)',
      ],
      steps: [
        {
          step: 1,
          title: 'ಸ್ವಾವಲಂಬನ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ನೋಂದಣಿ ಮಾಡಿ',
          instruction: 'ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ swavlambancard.gov.in ತೆರೆಯಿರಿ ಮತ್ತು "Apply for UDID Card" ಆಯ್ಕೆಮಾಡಿ.',
        },
        {
          step: 2,
          title: 'ವೈಯಕ್ತಿಕ ವಿವರ ಮತ್ತು ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
          instruction: 'ನಿಮ್ಮ ಹೆಸರು, ವಿಳಾಸ, ಮತ್ತು ಅಂಗವಿಕಲತೆಯ ವಿಧವನ್ನು ನಮೂದಿಸಿ ಭಾವಚಿತ್ರ ಲಗತ್ತಿಸಿ.',
        },
        {
          step: 3,
          title: 'ಜಿಲ್ಲಾ ಆಸ್ಪತ್ರೆ ವೈದ್ಯಕೀಯ ಮಂಡಳಿಯ ತಪಾಸಣೆ',
          instruction: 'ನಿಗದಿಪಡಿಸಿದ ದಿನಾಂಕದಂದು ಜಿಲ್ಲಾ ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆಗೆ ಭೇಟಿ ನೀಡಿ ವೈದ್ಯಕೀಯ ಮೌಲ್ಯಮಾಪನ ಪೂರ್ಣಗೊಳಿಸಿ.',
        },
        {
          step: 4,
          title: 'ಡಿಜಿಟಲ್ UDID ಕಾರ್ಡ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿಕೊಳ್ಳಿ',
          instruction: 'ಅನುಮೋದನೆಯ ನಂತರ ಕ್ಯೂಆರ್ ಕೋಡ್ ಸಹಿತ ಡಿಜಿಟಲ್ ಕಾರ್ಡ್ ಪಡೆಯಿರಿ. ಪ್ಲಾಸ್ಟಿಕ್ ಕಾರ್ಡ್ ಅಂಚೆ ಮೂಲಕ ತಲುಪುತ್ತದೆ.',
        },
      ],
      warnings: [
        'ಸರ್ಕಾರಿ ಜಿಲ್ಲಾ ಆಸ್ಪತ್ರೆಗಳಲ್ಲಿ ಅಂಗವಿಕಲತಾ ಪರೀಕ್ಷೆ ಸಂಪೂರ್ಣ ಉಚಿತವಾಗಿರುತ್ತದೆ.',
        'ಪ್ರಮಾಣಪತ್ರದಲ್ಲಿ ಅಂಗವಿಕಲತೆಯ ಶೇಕಡಾವಾರು ಪ್ರಮಾಣ (Percentage) ನಮೂದಾಗಿರುವುದನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.',
      ],
      officialUrl: 'https://www.swavlambancard.gov.in',
    },
  },
  {
    id: 'aadhaar-update',
    category: 'identity',
    icon: 'Fingerprint',
    en: {
      title: 'Aadhaar Card Updates & Mobile Linking',
      department: 'Unique Identification Authority of India (UIDAI)',
      shortDesc: 'Update address, link active mobile number, or verify biometric details for civic authentication.',
      helpline: 'UIDAI Toll-Free: 1947',
      documentsRequired: [
        'Existing 12-digit Aadhaar number',
        'Valid Proof of Address (Electricity bill, Bank passbook, or Voter card) for address update',
        'Active mobile number to receive verification OTP',
      ],
      steps: [
        {
          step: 1,
          title: 'Access Official UIDAI Portal',
          instruction: 'Open myaadhaar.uidai.gov.in in your browser and click "Login with OTP".',
        },
        {
          step: 2,
          title: 'Select Update Field',
          instruction: 'Choose "Address Update" -> "Update Aadhaar Online". Carefully review existing details.',
        },
        {
          step: 3,
          title: 'Upload Proof Document & Submit',
          instruction: 'Upload a clear scanned copy or photo of your address proof and pay the official nominal fee (₹50).',
        },
        {
          step: 4,
          title: 'Track via URN Number',
          instruction: 'Save the Service Request Number (URN) to monitor update status. Changes reflect within 5-15 working days.',
        },
      ],
      warnings: [
        'Biometric updates (fingerprints, iris, photo) and mobile number linking MUST be done in person at an official Aadhaar Seva Kendra.',
        'Never share your Aadhaar OTP with callers claiming your Aadhaar is blocked or expired.',
      ],
      officialUrl: 'https://myaadhaar.uidai.gov.in',
    },
    kn: {
      title: 'ಆಧಾರ್ ಕಾರ್ಡ್ ತಿದ್ದುಪಡಿ ಮತ್ತು ಮೊಬೈಲ್ ಲಿಂಕ್',
      department: 'ಭಾರತೀಯ ವಿಶಿಷ್ಟ ಗುರುತಿನ ಪ್ರಾಧಿಕಾರ (UIDAI)',
      shortDesc: 'ನಿಮ್ಮ ವಿಳಾಸ ಬದಲಾವಣೆ, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನವೀಕರಣ ಮತ್ತು ಬಯೋಮೆಟ್ರಿಕ್ ಸಕ್ರಿಯಗೊಳಿಸುವ ಮಾರ್ಗದರ್ಶಿ.',
      helpline: 'ಆಧಾರ್ ಉಚಿತ ಸಹಾಯವಾಣಿ: 1947',
      documentsRequired: [
        'ನಿಮ್ಮ ೧೨ ಅಂಕಿಯ ಆಧಾರ್ ಕಾರ್ಡ್ ಸಂಖ್ಯೆ',
        'ವಿಳಾಸ ಬದಲಾವಣೆಗಾಗಿ ಅಧಿಕೃತ ದಾಖಲೆ (ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ / ವಿದ್ಯುತ್ ಬಿಲ್ / ವೋಟರ್ ಐಡಿ)',
        'ಒಟಿಪಿ ಪಡೆಯಲು ಸಕ್ರಿಯವಾಗಿರುವ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
      ],
      steps: [
        {
          step: 1,
          title: 'ಅಧಿಕೃತ myAadhaar ಪೋರ್ಟಲ್‌ಗೆ ಭೇಟಿ ನೀಡಿ',
          instruction: 'ವೆಬ್‌ಸೈಟ್ myaadhaar.uidai.gov.in ತೆರೆಯಿರಿ ಮತ್ತು ಮೊಬೈಲ್ ಒಟಿಪಿ ಮೂಲಕ ಲಾಗಿನ್ ಆಗಿ.',
        },
        {
          step: 2,
          title: 'ವಿಳಾಸ ತಿದ್ದುಪಡಿ ಆಯ್ಕೆಮಾಡಿ',
          instruction: '"Update Address in Aadhaar" ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ ನಿಮ್ಮ ಹೊಸ ವಿಳಾಸವನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ನಮೂದಿಸಿ.',
        },
        {
          step: 3,
          title: 'ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಮತ್ತು ಶುಲ್ಕ ಪಾವತಿಸಿ',
          instruction: 'ವಿಳಾಸ ದೃಢೀಕರಣ ಪತ್ರದ ಸ್ಪಷ್ಟ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಸರ್ಕಾರದ ನಿಗದಿತ ಶುಲ್ಕ (₹೫೦) ಪಾವತಿಸಿ.',
        },
        {
          step: 4,
          title: 'URN ಸಂಖ್ಯೆ ಮೂಲಕ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ',
          instruction: 'ಅರ್ಜಿ ಸಲ್ಲಿಕೆಯ ನಂತರ ಸಿಗುವ URN ಸಂಖ್ಯೆಯನ್ನು ಸೇವ್ ಮಾಡಿ ಇಟ್ಟುಕೊಳ್ಳಿ. ೫ ರಿಂದ ೧೫ ದಿನಗಳಲ್ಲಿ ನವೀಕರಣವಾಗುತ್ತದೆ.',
        },
      ],
      warnings: [
        'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಲಿಂಕ್ ಮಾಡಲು ಮತ್ತು ಫೋಟೋ/ಬಯೋಮೆಟ್ರಿಕ್ ಬದಲಾಯಿಸಲು ಹತ್ತಿರದ ಆಧಾರ್ ಸೇವಾ ಕೇಂದ್ರಕ್ಕೆ ಸ್ವತಃ ಹೋಗಬೇಕು.',
        'ಯಾವುದೇ ವ್ಯಕ್ತಿಗೆ ನಿಮ್ಮ ಆಧಾರ್ ಒಟಿಪಿ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ. ಸರ್ಕಾರದ ಯಾರೂ ಫೋನ್‌ನಲ್ಲಿ ಒಟಿಪಿ ಕೇಳುವುದಿಲ್ಲ.',
      ],
      officialUrl: 'https://myaadhaar.uidai.gov.in',
    },
  },
];

export const UI_TRANSLATIONS = {
  en: {
    banner: {
      title: 'Citizen Digital Service Guide',
      subtitle: 'Clear, step-by-step guidance for Karnataka public digital services. Designed for seniors, rural citizens, and all abilities.',
      modeAuditor: 'Switch to Auditor Mode',
      modeCitizen: 'Citizen Mode',
    },
    controls: {
      langSwitch: 'Language',
      readAloud: 'Read Aloud',
      stopReading: 'Stop Reading',
      textSize: 'Text Size',
      highContrast: 'High Contrast',
      normalContrast: 'Standard Contrast',
      searchPlaceholder: 'Search public services (e.g. Ration, Land, Pension, Aadhaar)...',
      allCategories: 'All Services',
      foodCategory: 'Ration & Food',
      landCategory: 'Land & RTC',
      pensionCategory: 'Senior Pension',
      disabilityCategory: 'Disability & UDID',
      identityCategory: 'Aadhaar & Identity',
    },
    serviceCard: {
      requiredDocs: 'Required Documents Checklist',
      stepByStep: 'Step-by-Step Instructions',
      stepNumber: 'Step',
      listenToGuide: 'Listen to this Guide',
      stopGuide: 'Stop Audio',
      importantNotice: 'Important Warnings & Tips',
      openOfficialPortal: 'Open Official Government Portal',
      helplineLabel: 'Official Support',
      externalNote: 'Opens official government portal in a new tab. AccessGuard AI does not collect personal credentials.',
    },
    disclaimer: {
      title: 'Honest Digital Guidance Notice',
      text: 'AccessGuard AI provides independent accessibility guidance to help citizens navigate public websites. We DO NOT submit applications, issue government certificates, or collect personal Aadhaar/banking data. All transactions must be completed on official government portals or at authorized Grama One centers.',
    },
    helplineQuickBar: {
      title: 'Emergency & Civic Helplines',
      karnatakaHelpline: 'Janasnehi Karnataka: 1902',
      elderLine: 'Senior Citizens (ElderLine): 14567',
      aadhaarHelp: 'Aadhaar UIDAI: 1947',
      emergency: 'Police & Emergency: 112',
    },
  },
  kn: {
    banner: {
      title: 'ನಾಗರಿಕ ಡಿಜಿಟಲ್ ಸೇವಾ ಮಾರ್ಗದರ್ಶಿ',
      subtitle: 'ಕರ್ನಾಟಕದ ಸಾರ್ವಜನಿಕ ಡಿಜಿಟಲ್ ಸೇವೆಗಳ ಸರಳ ಮತ್ತು ಹಂತ-ಹಂತದ ಮಾರ್ಗದರ್ಶನ. ಹಿರಿಯ ನಾಗರಿಕರು ಮತ್ತು ಗ್ರಾಮೀಣ ಜನರಿಗಾಗಿ ವಿಶೇಷ ವಿನ್ಯಾಸ.',
      modeAuditor: 'ಆಡಿಟರ್ ಮೋಡ್‌ಗೆ ಬದಲಿಸಿ',
      modeCitizen: 'ನಾಗರಿಕ ಮೋಡ್',
    },
    controls: {
      langSwitch: 'ಭಾಷೆ',
      readAloud: 'ಗಟ್ಟಿಯಾಗಿ ಓದಿ',
      stopReading: 'ಓದುವುದನ್ನು ನಿಲ್ಲಿಸಿ',
      textSize: 'ಅಕ್ಷರ ಗಾತ್ರ',
      highContrast: 'ಅಧಿಕ ಕಾಂಟ್ರಾಸ್ಟ್',
      normalContrast: 'ಸಾಮಾನ್ಯ ಕಾಂಟ್ರಾಸ್ಟ್',
      searchPlaceholder: 'ಸೇವೆಗಳನ್ನು ಹುಡುಕಿ (ಉದಾ: ಪಡಿತರ, ಭೂಮಿ, ಪಿಂಚಣಿ, ಆಧಾರ್)...',
      allCategories: 'ಎಲ್ಲಾ ಸೇವೆಗಳು',
      foodCategory: 'ಆಹಾರ ಮತ್ತು ಪಡಿತರ',
      landCategory: 'ಭೂಮಿ ಮತ್ತು ಪಹಣಿ',
      pensionCategory: 'ಹಿರಿಯರ ಪಿಂಚಣಿ',
      disabilityCategory: 'ವಿಶೇಷ ಚೇತನರು (UDID)',
      identityCategory: 'ಆಧಾರ್ ಮತ್ತು ಗುರುತು',
    },
    serviceCard: {
      requiredDocs: 'ಅಗತ್ಯ ದಾಖಲೆಗಳ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ',
      stepByStep: 'ಹಂತ-ಹಂತದ ಸರಳ ಸೂಚನೆಗಳು',
      stepNumber: 'ಹಂತ',
      listenToGuide: 'ಈ ಮಾರ್ಗದರ್ಶಿಯನ್ನು ಆಲಿಸಿ',
      stopGuide: 'ಆಡಿಯೋ ನಿಲ್ಲಿಸಿ',
      importantNotice: 'ಮುಖ್ಯ ಎಚ್ಚರಿಕೆ ಮತ್ತು ಸಲಹೆಗಳು',
      openOfficialPortal: 'ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ',
      helplineLabel: 'ಅಧಿಕೃತ ಸಹಾಯವಾಣಿ',
      externalNote: 'ಸರ್ಕಾರದ ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ ಹೊಸ ಟ್ಯಾಬ್‌ನಲ್ಲಿ ತೆರೆಯುತ್ತದೆ. ಆಕ್ಸೆಸ್‌ಗಾರ್ಡ್ ಯಾವುದೇ ವೈಯಕ್ತಿಕ ವಿವರಗಳನ್ನು ಪಡೆಯುವುದಿಲ್ಲ.',
    },
    disclaimer: {
      title: 'ಪ್ರಾಮಾಣಿಕ ನಾಗರಿಕ ಮಾರ್ಗದರ್ಶನ ಪ್ರಕಟಣೆ',
      text: 'ಆಕ್ಸೆಸ್‌ಗಾರ್ಡ್ AI ಕೇವಲ ಸಾರ್ವಜನಿಕ ವೆಬ್‌ಸೈಟ್‌ಗಳನ್ನು ಬಳಸಲು ಮಾರ್ಗದರ್ಶನ ನೀಡುವ ಸ್ವತಂತ್ರ ತಾಣವಾಗಿದೆ. ನಾವು ಯಾವುದೇ ಸರ್ಕಾರಿ ಅರ್ಜಿಯನ್ನು ನೇರವಾಗಿ ಸಲ್ಲಿಸುವುದಿಲ್ಲ ಮತ್ತು ಯಾವುದೇ ವೈಯಕ್ತಿಕ ಆಧಾರ್ ಅಥವಾ ಬ್ಯಾಂಕ್ ಮಾಹಿತಿಯನ್ನು ಸಂಗ್ರಹಿಸುವುದಿಲ್ಲ. ಎಲ್ಲಾ ಅರ್ಜಿಗಳನ್ನು ಅಧಿಕೃತ ಸರ್ಕಾರಿ ವೆಬ್‌ಸೈಟ್ ಅಥವಾ ಗ್ರಾಮ ಒನ್ ಕೇಂದ್ರಗಳಲ್ಲಿ ಮಾತ್ರ ಸಲ್ಲಿಸಿ.',
    },
    helplineQuickBar: {
      title: 'ತುರ್ತು ಮತ್ತು ಸಾರ್ವಜನಿಕ ಸಹಾಯವಾಣಿ ಸಂಖ್ಯೆಗಳು',
      karnatakaHelpline: 'ಜನಸ್ನೇಹಿ ಕರ್ನಾಟಕ: 1902',
      elderLine: 'ಹಿರಿಯ ನಾಗರಿಕರ ಸಹಾಯವಾಣಿ: 14567',
      aadhaarHelp: 'ಆಧಾರ್ ಯುಐಡಿಎಐ: 1947',
      emergency: 'ತುರ್ತು ಸೇವೆಗಳು: 112',
    },
  },
};
