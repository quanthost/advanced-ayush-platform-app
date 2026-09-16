import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, SafeAreaView, Modal, Platform, Alert } from 'react-native';
import { WebView } from 'react-native-webview';

const API_URL = 'https://ayush-backend-api.onrender.com/api/v1';

// --- INDIAN SCHEDULED LANGUAGES DIRECTORY ---
const INDIAN_LANGUAGES = [
  { code: 'English', label: 'English', icon: '🇬🇧' }, { code: 'Hindi', label: 'हिंदी (Hindi)', icon: '🇮🇳' },
  { code: 'Tamil', label: 'தமிழ் (Tamil)', icon: '🪔' }, { code: 'Telugu', label: 'తెలుగు (Telugu)', icon: '🌾' },
  { code: 'Bengali', label: 'বাংলা (Bengali)', icon: '🐅' }, { code: 'Marathi', label: 'मराठी (Marathi)', icon: '🚩' },
  { code: 'Gujarati', label: 'ગુજરાતી (Gujarati)', icon: '🪕' }, { code: 'Kannada', label: 'ಕನ್ನಡ (Kannada)', icon: '🐘' },
  { code: 'Malayalam', label: 'മലയാളം (Malayalam)', icon: '🌴' }, { code: 'Odia', label: 'ଓଡ଼ିଆ (Odia)', icon: '🌊' },
  { code: 'Punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)', icon: '🌾' }, { code: 'Assamese', label: 'অসমীয়া (Assamese)', icon: '🫖' },
  { code: 'Urdu', label: 'اردو (Urdu)', icon: '🌙' }, { code: 'Sanskrit', label: 'संस्कृतम् (Sanskrit)', icon: '🕉️' },
  { code: 'Kashmiri', label: 'कॉशुर (Kashmiri)', icon: '🏔️' }, { code: 'Konkani', label: 'कोंकणी (Konkani)', icon: '🏖️' }
];

const TRANSLATIONS: Record<string, Record<string, string>> = {
  English: {
    kioskTitle: 'MediKiosk Clinical Intake',
    companyName: 'BINARY BRAINS SOLUTIONS',
    startIntake: 'Begin AI Case-Taking',
    chiefComplaintPrompt: 'State your primary discomfort or symptoms:',
    voiceListening: 'Listening to speech in your language...',
    redFlagAlert: 'CRITICAL EMERGENCY: Red-flag symptoms detected. Routine queue bypassed.',
    socratesTitle: 'Symptom Deep-Dive (SOCRATES Framework)',
    ayushTitle: 'Ayurvedic Assessment (Dashavidha Pariksha)',
    documentScanTitle: 'Digitize Historic Medical Documents',
    summaryTitle: 'Physician-Ready Structured History',
    printSummary: 'Print Clinical Summary',
    doctorWorkspace: 'Clinical Workspace',
    patientRole: 'Patient / Kiosk User',
    doctorRole: 'Attending Physician',
    loginPrompt: 'Sign in to access kiosk session',
    dpdpConsent: 'DPDP Act 2023 Granular Health Consent',
    grantConsent: 'I Grant Consent to Digitize & Structure My Health Data'
  },
  Hindi: {
    kioskTitle: 'मेडीकियोस्क क्लिनिकल इंटेक',
    companyName: 'बाइनरी ब्रेन्स सॉल्यूशंस',
    startIntake: 'एआई केस-टेकिंग शुरू करें',
    chiefComplaintPrompt: 'अपनी मुख्य समस्या या लक्षण बताएं:',
    voiceListening: 'आपकी भाषा में आवाज सुनी जा रही है...',
    redFlagAlert: 'आपातकालीन चेतावनी: गंभीर लक्षण मिले हैं। सामान्य कतार बायपास की गई।',
    socratesTitle: 'लक्षण गहन विश्लेषण (SOCRATES रूपरेखा)',
    ayushTitle: 'आयुर्वेदिक परीक्षण (दशविध परीक्षा)',
    documentScanTitle: 'पुराने मेडिकल दस्तावेज डिजिटाइज़ करें',
    summaryTitle: 'चिकित्सक के लिए तैयार क्लिनिकल सारांश',
    printSummary: 'क्लिनिकल सारांश प्रिंट करें',
    doctorWorkspace: 'चिकित्सक वर्कस्पेस',
    patientRole: 'मरीज / कियोस्क उपयोगकर्ता',
    doctorRole: 'उपस्थित चिकित्सक',
    loginPrompt: 'कियोस्क सत्र शुरू करने के लिए साइन इन करें',
    dpdpConsent: 'डीपीडीपी अधिनियम 2023 स्वास्थ्य सहमति',
    grantConsent: 'मैं अपने स्वास्थ्य डेटा को डिजिटाइज़ करने की सहमति देता हूँ'
  },
  Tamil: {
    kioskTitle: 'மெடிகியோஸ்க் மருத்துவ தகவல் பதிவு',
    companyName: 'பைனரி பிரைன்ஸ் சொல்யூஷன்ஸ்',
    startIntake: 'AI மருத்துவ வரலாறு பதிவைத் தொடங்குக',
    chiefComplaintPrompt: 'உங்கள் முதன்மை உடல்நலக் குறைபாட்டை விவரிக்கவும்:',
    voiceListening: 'உங்கள் குரல் கேட்கப்படுகிறது...',
    redFlagAlert: 'அவசர எச்சரிக்கை: கடுமையான அறிகுறிகள் கண்டறியப்பட்டன.',
    socratesTitle: 'அறிகுறி பகுப்பாய்வு (SOCRATES கட்டமைப்பு)',
    ayushTitle: 'ஆயுர்வேத மதிப்பீடு (தசவித பரீட்சை)',
    documentScanTitle: 'பழைய மருத்துவ ஆவணங்களை டிஜிட்டல் மயமாக்குங்கள்',
    summaryTitle: 'மருத்துவர் சரிபார்க்கும் மருத்துவ அறிக்கை',
    printSummary: 'மருத்துவ அறிக்கையை அச்சிடுக',
    doctorWorkspace: 'மருத்துவப் பணியிடம்',
    patientRole: 'நோயாளி / கியோஸ்க் பயனர்',
    doctorRole: 'மருத்துவர்',
    loginPrompt: 'அமர்வைத் தொடங்க உள்நுழையவும்',
    dpdpConsent: 'DPDP சட்டம் 2023 சுகாதார ஒப்புதல்',
    grantConsent: 'என் மருத்துவத் தரவை டிஜிட்டல் மயமாக்க ஒப்புதல் அளிக்கிறேன்'
  }
};

export default function MediKioskPlatform() {
  // Navigation & Accessibility States
  const [step, setStep] = useState<'language_select' | 'auth_role' | 'dpdp_consent' | 'kiosk_intake' | 'doctor_dashboard'>('language_select');
  const [language, setLanguage] = useState('English');
  const [highContrast, setHighContrast] = useState(false);
  const [audioGuidance, setAudioGuidance] = useState(true);
  const [largeText, setLargeText] = useState(false);

  const t = (k: string) => TRANSLATIONS[language]?.[k] || TRANSLATIONS['English']?.[k] || k;

  // Session & User States
  const [sessionId, setSessionId] = useState(`MKS-${Date.now().toString().slice(-6)}`);
  const [userRole, setUserRole] = useState<'patient' | 'doctor'>('patient');
  const [abhaInput, setAbhaInput] = useState('');
  const [patientName, setPatientName] = useState('Nishanth S');
  const [doctorId, setDoctorId] = useState('DR-01');

  // Module A: Conversational History States
  const [isRecording, setIsRecording] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [triageAlert, setTriageAlert] = useState<'ROUTINE' | 'EMERGENCY_RED_FLAG'>('ROUTINE');
  const [assignedDept, setAssignedDept] = useState('Kayachikitsa');
  const [socratesData, setSocratesData] = useState({
    site: 'Bilateral Knee Joints',
    onset: 'Gradual onset over 4 months',
    character: 'Aching stiffness and morning swelling',
    radiation: 'Extending to ankles',
    associations: 'Fatigue, Agnimandya (poor appetite)',
    timing: 'Worse early morning for first 60 minutes',
    exacerbating: 'Cold weather and physical exertion',
    severity: '7 out of 10'
  });

  // Module A: Dashavidha Pariksha (Ayurveda Intake)
  const [dashavidha, setDashavidha] = useState({
    prakriti: 'Vata-Kapha',
    vikriti: 'Vata-Pitta Imbalance',
    sara: 'Madhyama (Moderate tissue vitality)',
    samhanana: 'Madhyama (Medium body build)',
    pramana: 'Normal anthropometric proportion',
    satmya: 'Mishra Satmya',
    sattva: 'Madhyama (Moderate mental resolve)',
    ahara_shakti: 'Avaram (Low digestive capacity / Mandagni)',
    vyayama_shakti: 'Avaram (Low physical endurance)',
    vaya: 'Madhyama (Adult)',
    koshtha: 'Krura Koshtha (Constipated tendency)'
  });

  // Module B: Medical Document Digitization & OCR
  const [scannedDocuments, setScannedDocuments] = useState<any[]>([
    {
      id: 'DOC-1',
      title: 'Previous Prescription - AYUSH Dispensary',
      date: '14 Jan 2026',
      extractedMedications: ['Yogaraj Guggulu (2 tabs BD)', 'Dashmularishta (20ml BD)'],
      abnormalFlags: []
    },
    {
      id: 'DOC-2',
      title: 'Biochemistry Panel - Serum Analysis',
      date: '02 Feb 2026',
      extractedMedications: [],
      abnormalFlags: ['Serum Uric Acid: 7.9 mg/dL (High)', 'ESR: 38 mm/hr (Elevated)']
    }
  ]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Module C: Doctor Verification Workspace
  const [doctorEMRModal, setDoctorEMRModal] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<string[]>(['NAM:AYU-AM01 (Amavata)', 'ICD11:FA20 (Rheumatoid Arthritis)']);
  const [activeTab, setActiveTab] = useState<'kiosk' | 'queue' | 'telemed'>('kiosk');

  // -------------------------------------------------------------
  // HANDLERS & SIMULATIONS
  // -------------------------------------------------------------
  const simulateVoiceASR = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      const sampleSymptom = "Severe joint pain and knee swelling every morning with poor digestion.";
      setChiefComplaint(sampleSymptom);
      evaluateComplaintOnServer(sampleSymptom);
    }, 1800);
  };

  const evaluateComplaintOnServer = async (text: string) => {
    try {
      const res = await fetch(`${API_URL}/kiosk/intake/chief-complaint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, chief_complaint: text })
      });
      const data = await res.json();
      setTriageAlert(data.triage_level);
      setAssignedDept(data.assigned_department);
    } catch {
      if (text.toLowerCase().includes('chest') || text.toLowerCase().includes('stroke')) {
        setTriageAlert('EMERGENCY_RED_FLAG');
        setAssignedDept('Emergency Critical Care');
      } else {
        setTriageAlert('ROUTINE');
        setAssignedDept('Kayachikitsa');
      }
    }
  };

  const simulateDocumentScan = () => {
    setUploadingDoc(true);
    setTimeout(() => {
      const newDoc = {
        id: `DOC-${Date.now().toString().slice(-4)}`,
        title: 'New Digitized Paper Prescription',
        date: new Date().toLocaleDateString(),
        extractedMedications: ['Ashwagandha Capsule (1 OD)', 'Triphala Churna (5g HS)'],
        abnormalFlags: []
      };
      setScannedDocuments([newDoc, ...scannedDocuments]);
      setUploadingDoc(false);
      Alert.alert('OCR Complete', 'Prescription entities, dosages, and dates extracted successfully.');
    }, 1500);
  };

  const triggerPrintSummary = () => {
    if (Platform.OS === 'web') {
      window.print();
    } else {
      Alert.alert('Download Ready', 'MediKiosk_Structured_Clinical_Summary.pdf generated successfully.');
    }
  };

  const purgeSessionData = () => {
    setChiefComplaint('');
    setTriageAlert('ROUTINE');
    setSessionId(`MKS-${Date.now().toString().slice(-6)}`);
    setStep('language_select');
    Alert.alert('Session Terminated', 'Terminal cache purged in compliance with DPDP Act 2023.');
  };

  // =============================================================
  // SCREEN 1: LANGUAGE SELECTION & ACCESSIBILITY
  // =============================================================
  if (step === 'language_select') {
    return (
      <SafeAreaView style={[styles.screenContainer, highContrast && styles.highContrastBg]}>
        {/* Accessibility Toolbar */}
        <View style={styles.accessToolbar}>
          <TouchableOpacity style={styles.accessPill} onPress={() => setAudioGuidance(!audioGuidance)}>
            <Text style={styles.accessText}>🔊 Audio: {audioGuidance ? 'ON' : 'OFF'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.accessPill} onPress={() => setHighContrast(!highContrast)}>
            <Text style={styles.accessText}>👁️ Contrast: {highContrast ? 'HIGH' : 'STD'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.accessPill} onPress={() => setLargeText(!largeText)}>
            <Text style={styles.accessText}>🔍 Text: {largeText ? 'LG' : 'MD'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.companyHeadingContainer}>
          <Text style={[styles.companyHeadingText, largeText && { fontSize: 26 }]}>BINARY BRAINS SOLUTIONS</Text>
          <View style={styles.companyDivider} />
          <Text style={[styles.kioskSubtitle, largeText && { fontSize: 16 }]}>{t('kioskTitle')}</Text>
        </View>

        <Text style={[styles.roleQuestionText, largeText && { fontSize: 20 }]}>Select Language / भाषा चुनें</Text>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {INDIAN_LANGUAGES.map((lang, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.largeRoleBtn, highContrast && styles.highContrastCard]}
              onPress={() => {
                setLanguage(lang.code);
                setStep('auth_role');
              }}
            >
              <Text style={styles.largeRoleIcon}>{lang.icon}</Text>
              <Text style={[styles.largeRoleBtnText, largeText && { fontSize: 18 }]}>{lang.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =============================================================
  // SCREEN 2: AUTHENTICATION & ROLE NAVIGATION
  // =============================================================
  if (step === 'auth_role') {
    return (
      <SafeAreaView style={[styles.screenContainer, highContrast && styles.highContrastBg]}>
        <View style={styles.topNavRow}>
          <TouchableOpacity onPress={() => setStep('language_select')}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>{t('loginPrompt')}</Text>
        </View>

        <View style={styles.companyHeadingContainer}>
          <Text style={styles.companyHeadingText}>{t('companyName')}</Text>
          <View style={styles.companyDivider} />
        </View>

        <View style={{ marginTop: 40, marginBottom: 20 }}>
          <TouchableOpacity
            style={styles.largeRoleBtn}
            onPress={() => {
              setUserRole('patient');
              setStep('dpdp_consent');
            }}
          >
            <Text style={styles.largeRoleIcon}>🧑‍🤝‍🧑</Text>
            <View>
              <Text style={styles.largeRoleBtnText}>{t('patientRole')}</Text>
              <Text style={styles.subtext}>Scan ABHA ID / Aadhaar & Record Case</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.largeRoleBtn}
            onPress={() => {
              setUserRole('doctor');
              setStep('doctor_dashboard');
            }}
          >
            <Text style={styles.largeRoleIcon}>🩺</Text>
            <View>
              <Text style={styles.largeRoleBtnText}>{t('doctorRole')}</Text>
              <Text style={styles.subtext}>Review Structured Histories in OPD</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // =============================================================
  // SCREEN 3: DPDP ACT 2023 GRANULAR CONSENT (MODULE D)
  // =============================================================
  if (step === 'dpdp_consent') {
    return (
      <SafeAreaView style={[styles.screenContainer, highContrast && styles.highContrastBg]}>
        <View style={styles.topNavRow}>
          <TouchableOpacity onPress={() => setStep('auth_role')}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>{t('dpdpConsent')}</Text>
        </View>

        <View style={styles.consentCard}>
          <Text style={styles.consentHeader}>🔒 Compliance with DPDP Act 2023 & ABDM</Text>
          <Text style={styles.consentBody}>
            MediKiosk will record your clinical history via speech recognition, structure presenting symptoms, and scan medical documents.
            Data is encrypted and transmitted directly to the hospital physician. Session data on this kiosk is ephemeral and purged immediately after submission.
          </Text>
          <View style={styles.inputWrapper}>
            <View style={styles.countryCodeBox}><Text style={styles.flagText}>🪪 ABHA</Text></View>
            <TextInput
              style={styles.phoneInput}
              placeholder="Enter ABHA ID or Mobile Number"
              value={abhaInput}
              onChangeText={setAbhaInput}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryGreenBtn}
          onPress={() => setStep('kiosk_intake')}
        >
          <Text style={styles.primaryBtnText}>{t('grantConsent')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // =============================================================
  // SCREEN 4: MEDIKIOSK AI CASE-TAKING ENGINE (MODULES A, B, C)
  // =============================================================
  if (step === 'kiosk_intake') {
    return (
      <SafeAreaView style={[styles.screenContainer, highContrast && styles.highContrastBg]}>
        {/* Red Flag Emergency Banner */}
        {triageAlert === 'EMERGENCY_RED_FLAG' && (
          <View style={styles.redFlagCard}>
            <Text style={styles.redFlagHeading}>⚠️ CRITICAL TRIAGE ALERT</Text>
            <Text style={styles.redFlagText}>{t('redFlagAlert')}</Text>
            <Text style={styles.redFlagSub}>Immediate dispatch to: Emergency Critical Care Unit</Text>
          </View>
        )}

        {/* Kiosk Header */}
        <View style={styles.patHeader}>
          <View style={styles.patHeaderLeft}>
            <Text style={styles.patHeaderTitle}>Terminal ID: {sessionId}</Text>
          </View>
          <TouchableOpacity style={styles.purgeBtn} onPress={purgeSessionData}>
            <Text style={styles.purgeBtnText}>Purge & Exit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
          {/* Quick Pastel Status Cards */}
          <View style={styles.gridRow}>
            <View style={[styles.pastelCard, { backgroundColor: '#fef3c7' }]}>
              <Text style={styles.cardBoldText}>Assigned Dept</Text>
              <Text style={styles.cardValText}>{assignedDept}</Text>
              <Text style={styles.cardEmoji}>🏥</Text>
            </View>
            <View style={[styles.pastelCard, { backgroundColor: '#dcfce7' }]}>
              <Text style={styles.cardBoldText}>Triage Priority</Text>
              <Text style={[styles.cardValText, triageAlert === 'EMERGENCY_RED_FLAG' && { color: '#ef4444' }]}>
                {triageAlert}
              </Text>
              <Text style={styles.cardEmoji}>⚡</Text>
            </View>
            <View style={[styles.pastelCard, { backgroundColor: '#e0e7ff' }]}>
              <Text style={styles.cardBoldText}>ABHA Status</Text>
              <Text style={styles.cardValText}>Linked & Verified</Text>
              <Text style={styles.cardEmoji}>🪪</Text>
            </View>
          </View>

          {/* Module A: Speech + Touch Intake */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>{t('chiefComplaintPrompt')}</Text>
            <View style={styles.speechRow}>
              <TextInput
                style={styles.complaintInput}
                placeholder="Type complaint or tap speech button..."
                value={chiefComplaint}
                onChangeText={(text) => {
                  setChiefComplaint(text);
                  evaluateComplaintOnServer(text);
                }}
                multiline
              />
              <TouchableOpacity
                style={[styles.micBtn, isRecording && { backgroundColor: '#ef4444' }]}
                onPress={simulateVoiceASR}
              >
                <Text style={styles.micIcon}>{isRecording ? '⏹️' : '🎙️'}</Text>
              </TouchableOpacity>
            </View>
            {isRecording && <Text style={styles.listeningText}>{t('voiceListening')}</Text>}
          </View>

          {/* Module A: SOCRATES Adaptive Branching */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>{t('socratesTitle')}</Text>
            <View style={styles.socratesGrid}>
              <View style={styles.socratesItem}><Text style={styles.socLabel}>Site:</Text><Text style={styles.socVal}>{socratesData.site}</Text></View>
              <View style={styles.socratesItem}><Text style={styles.socLabel}>Onset:</Text><Text style={styles.socVal}>{socratesData.onset}</Text></View>
              <View style={styles.socratesItem}><Text style={styles.socLabel}>Character:</Text><Text style={styles.socVal}>{socratesData.character}</Text></View>
              <View style={styles.socratesItem}><Text style={styles.socLabel}>Radiation:</Text><Text style={styles.socVal}>{socratesData.radiation}</Text></View>
              <View style={styles.socratesItem}><Text style={styles.socLabel}>Associations:</Text><Text style={styles.socVal}>{socratesData.associations}</Text></View>
              <View style={styles.socratesItem}><Text style={styles.socLabel}>Timing:</Text><Text style={styles.socVal}>{socratesData.timing}</Text></View>
              <View style={styles.socratesItem}><Text style={styles.socLabel}>Exacerbating:</Text><Text style={styles.socVal}>{socratesData.exacerbating}</Text></View>
              <View style={styles.socratesItem}><Text style={styles.socLabel}>Severity:</Text><Text style={styles.socVal}>{socratesData.severity}</Text></View>
            </View>
          </View>

          {/* Module A: Dashavidha Pariksha (Ayurvedic Clinical Depth) */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>{t('ayushTitle')}</Text>
            <View style={styles.ayushGrid}>
              <View style={styles.ayushPill}><Text style={styles.ayushPillTitle}>Prakriti:</Text><Text style={styles.ayushPillVal}>{dashavidha.prakriti}</Text></View>
              <View style={styles.ayushPill}><Text style={styles.ayushPillTitle}>Vikriti:</Text><Text style={styles.ayushPillVal}>{dashavidha.vikriti}</Text></View>
              <View style={styles.ayushPill}><Text style={styles.ayushPillTitle}>Agni (Digestion):</Text><Text style={styles.ayushPillVal}>{dashavidha.ahara_shakti}</Text></View>
              <View style={styles.ayushPill}><Text style={styles.ayushPillTitle}>Koshtha (Bowel):</Text><Text style={styles.ayushPillVal}>{dashavidha.koshtha}</Text></View>
              <View style={styles.ayushPill}><Text style={styles.ayushPillTitle}>Sara (Tissue Vitality):</Text><Text style={styles.ayushPillVal}>{dashavidha.sara}</Text></View>
              <View style={styles.ayushPill}><Text style={styles.ayushPillTitle}>Vyayama (Endurance):</Text><Text style={styles.ayushPillVal}>{dashavidha.vyayama_shakti}</Text></View>
            </View>
          </View>

          {/* Module B: Document Scanning, OCR, & Lab Highlighting */}
          <View style={styles.sectionContainer}>
            <View style={styles.headerWithAction}>
              <Text style={styles.sectionHeading}>{t('documentScanTitle')}</Text>
              <TouchableOpacity style={styles.scanActionBtn} onPress={simulateDocumentScan}>
                <Text style={styles.scanActionBtnText}>📸 Scan Physical Paper</Text>
              </TouchableOpacity>
            </View>

            {uploadingDoc && <ActivityIndicator color="#059669" style={{ marginVertical: 10 }} />}

            {scannedDocuments.map((doc) => (
              <View key={doc.id} style={styles.docScanCard}>
                <View style={styles.docCardHeader}>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  <Text style={styles.docDate}>{doc.date}</Text>
                </View>
                {doc.extractedMedications.length > 0 && (
                  <View style={{ marginTop: 6 }}>
                    <Text style={styles.docTagHeader}>Extracted Medications:</Text>
                    {doc.extractedMedications.map((m: string, i: number) => (
                      <Text key={i} style={styles.docMedItem}>• {m}</Text>
                    ))}
                  </View>
                )}
                {doc.abnormalFlags.length > 0 && (
                  <View style={{ marginTop: 6 }}>
                    <Text style={styles.docAbnormalHeader}>⚠️ Out-of-Range Clinical Findings:</Text>
                    {doc.abnormalFlags.map((f: string, i: number) => (
                      <Text key={i} style={styles.docAbnormalItem}>{f}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Module C: Structured Clinical Summary Generator */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>{t('summaryTitle')}</Text>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryRow}>👤 <Text style={styles.boldText}>Patient:</Text> {patientName} (35 / M)</Text>
              <Text style={styles.summaryRow}>🩺 <Text style={styles.boldText}>Chief Complaint:</Text> {chiefComplaint || 'Bilateral knee joint stiffness'}</Text>
              <Text style={styles.summaryRow}>🌿 <Text style={styles.boldText}>Ayurvedic Diagnostics:</Text> {dashavidha.prakriti} | {dashavidha.vikriti}</Text>
              <Text style={styles.summaryRow}>💊 <Text style={styles.boldText}>Active Historic Rx:</Text> Yogaraj Guggulu, Dashmularishta</Text>
              <Text style={styles.summaryRow}>🔬 <Text style={styles.boldText}>Lab Flags:</Text> Uric Acid 7.9 mg/dL (Elevated)</Text>
            </View>

            <TouchableOpacity style={styles.primaryGreenBtn} onPress={triggerPrintSummary}>
              <Text style={styles.primaryBtnText}>🖨️ {t('printSummary')} (PDF / AirPrint)</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =============================================================
  // SCREEN 5: DOCTOR OP-ROOM CLINICAL WORKSPACE
  // =============================================================
  return (
    <SafeAreaView style={styles.screenContainer}>
      <View style={styles.doctorHeader}>
        <View>
          <Text style={styles.docHeaderTitle}>Dr. Clinical Officer (ID: {doctorId})</Text>
          <Text style={styles.docHeaderSub}>AIIA OPD Room 4 • MediKiosk Live HIS Sync</Text>
        </View>
        <TouchableOpacity style={styles.docExitBtn} onPress={() => setStep('language_select')}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        <Text style={styles.sectionHeading}>Incoming MediKiosk Intake Queue</Text>
        <View style={styles.queueCardDoctor}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.queuePatientName}>{patientName}</Text>
              <Text style={styles.queueBadgeRoutine}>Intake Completed (Terminal #1)</Text>
            </View>
            <Text style={styles.queuePatientMeta}>ABHA: 33-8921-1234-2026 • 35 Y / Male</Text>
            <Text style={styles.queueSymptomText}>Chief Complaint: {chiefComplaint || 'Bilateral knee stiffness, Mandagni'}</Text>
          </View>
          <TouchableOpacity style={styles.consultDocBtn} onPress={() => setDoctorEMRModal(true)}>
            <Text style={styles.consultDocBtnText}>Review & Prescribe</Text>
          </TouchableOpacity>
        </View>

        {/* Telemedicine Consultation Suite (Preserved) */}
        {activeTab === 'telemed' && (
          <View style={{ height: 400, marginTop: 14 }}>
            <Text style={styles.sectionHeading}>Telemedicine Consultation Suite</Text>
            {Platform.OS === 'web' ? (
              <iframe
                src="https://meet.jit.si/BinaryBrainsAyushConsult"
                style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
                allow="camera; microphone; fullscreen; display-capture"
              />
            ) : (
              <WebView
                source={{ uri: 'https://meet.jit.si/BinaryBrainsAyushConsult' }}
                style={{ flex: 1, borderRadius: 8 }}
                allowsInlineMediaPlayback
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Doctor Verification Modal */}
      <Modal visible={doctorEMRModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Physician EMR Verification (30-Sec Review)</Text>
            <Text style={styles.subtext}>AIIA Clinical Practice Guidelines • Editable Draft Summary</Text>

            <TextInput
              style={styles.emrEditInput}
              multiline
              value={editedNotes || `Confirmed Amavata presentation. Mandagni noted. Addressed elevated Uric Acid (7.9 mg/dL). Discontinue prior NSAIDs.`}
              onChangeText={setEditedNotes}
            />

            <Text style={styles.fieldLabel}>Dual Terminology Codes (NAMASTE / ICD-11):</Text>
            <View style={styles.tagRow}>
              {selectedCodes.map((c, i) => (
                <View key={i} style={styles.tagPill}><Text style={styles.tagText}>{c}</Text></View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.primaryGreenBtn}
              onPress={() => {
                setDoctorEMRModal(false);
                Alert.alert('EHR Updated', 'Summary confirmed, codified, and synchronized with ABDM PHR.');
              }}
            >
              <Text style={styles.primaryBtnText}>Confirm, Codify & Sync to ABHA</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 12, alignSelf: 'center' }} onPress={() => setDoctorEMRModal(false)}>
              <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('kiosk')}>
          <Text style={styles.navIcon}>📋</Text>
          <Text style={styles.navText}>OPD Queue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('telemed')}>
          <Text style={styles.navIcon}>📹</Text>
          <Text style={styles.navText}>Telemed Suite</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={triggerPrintSummary}>
          <Text style={styles.navIcon}>🖨️</Text>
          <Text style={styles.navText}>Print Summary</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// =============================================================
// PRESERVED THEME STYLESHEET
// =============================================================
const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#ffffff' },
  highContrastBg: { backgroundColor: '#000000' },
  accessToolbar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#f1f5f9', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  accessPill: { backgroundColor: '#ffffff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14, borderWidth: 1, borderColor: '#cbd5e1' },
  accessText: { fontSize: 11, fontWeight: 'bold', color: '#1e293b' },
  companyHeadingContainer: { alignItems: 'center', marginVertical: 16 },
  companyHeadingText: { fontSize: 20, fontWeight: '900', color: '#1e293b', letterSpacing: 1.2 },
  companyDivider: { width: 44, height: 4, backgroundColor: '#059669', marginTop: 6, borderRadius: 2 },
  kioskSubtitle: { fontSize: 13, fontWeight: '600', color: '#059669', marginTop: 4 },
  roleQuestionText: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginBottom: 16 },
  largeRoleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e0', padding: 16, borderRadius: 12, marginBottom: 12, marginHorizontal: 16 },
  highContrastCard: { backgroundColor: '#1e293b', borderColor: '#ffffff' },
  largeRoleIcon: { fontSize: 28, marginRight: 16 },
  largeRoleBtnText: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  topNavRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backArrow: { fontSize: 22, fontWeight: 'bold', marginRight: 14 },
  navTitle: { fontSize: 16, fontWeight: 'bold' },
  consentCard: { padding: 16, backgroundColor: '#f0fdf4', margin: 16, borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0' },
  consentHeader: { fontSize: 14, fontWeight: 'bold', color: '#166534', marginBottom: 8 },
  consentBody: { fontSize: 12, color: '#14532d', lineHeight: 18, marginBottom: 12 },
  inputWrapper: { flexDirection: 'row', borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 8, backgroundColor: '#ffffff', height: 46, alignItems: 'center' },
  countryCodeBox: { paddingHorizontal: 10, borderRightWidth: 1, borderRightColor: '#cbd5e0' },
  flagText: { fontSize: 12, fontWeight: 'bold' },
  phoneInput: { flex: 1, paddingHorizontal: 10, fontSize: 13 },
  primaryGreenBtn: { backgroundColor: '#059669', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginHorizontal: 16, marginTop: 10 },
  primaryBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  redFlagCard: { backgroundColor: '#fee2e2', padding: 14, borderBottomWidth: 2, borderColor: '#ef4444' },
  redFlagHeading: { color: '#991b1b', fontWeight: '900', fontSize: 14 },
  redFlagText: { color: '#b91c1c', fontSize: 12, marginTop: 2 },
  redFlagSub: { color: '#7f1d1d', fontSize: 11, fontWeight: 'bold', marginTop: 4 },
  patHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  patHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  patHeaderTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  purgeBtn: { backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  purgeBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, marginTop: 10 },
  pastelCard: { flex: 1, marginHorizontal: 3, padding: 10, borderRadius: 8, minHeight: 74, justifyContent: 'space-between' },
  cardBoldText: { fontSize: 11, fontWeight: 'bold', color: '#1e293b' },
  cardValText: { fontSize: 12, fontWeight: '900', color: '#0f172a' },
  cardEmoji: { alignSelf: 'flex-end', fontSize: 14 },
  sectionContainer: { marginHorizontal: 14, marginTop: 14, padding: 12, backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionHeading: { fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  speechRow: { flexDirection: 'row', gap: 8 },
  complaintInput: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, fontSize: 13, minHeight: 48 },
  micBtn: { width: 48, height: 48, backgroundColor: '#059669', borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  micIcon: { fontSize: 20 },
  listeningText: { color: '#ef4444', fontSize: 11, fontWeight: 'bold', marginTop: 4 },
  socratesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  socratesItem: { width: '48%', backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  socLabel: { fontSize: 10, fontWeight: 'bold', color: '#059669' },
  socVal: { fontSize: 11, color: '#1e293b', marginTop: 2 },
  ayushGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ayushPill: { width: '48%', backgroundColor: '#f0fdf4', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#bbf7d0' },
  ayushPillTitle: { fontSize: 10, fontWeight: 'bold', color: '#166534' },
  ayushPillVal: { fontSize: 11, color: '#14532d', marginTop: 2 },
  headerWithAction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  scanActionBtn: { backgroundColor: '#0f172a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  scanActionBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  docScanCard: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },
  docCardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  docTitle: { fontSize: 12, fontWeight: 'bold', color: '#1e293b' },
  docDate: { fontSize: 10, color: '#64748b' },
  docTagHeader: { fontSize: 10, fontWeight: 'bold', color: '#475569' },
  docMedItem: { fontSize: 11, color: '#1e293b' },
  docAbnormalHeader: { fontSize: 10, fontWeight: 'bold', color: '#ef4444' },
  docAbnormalItem: { fontSize: 11, color: '#b91c1c', fontWeight: 'bold' },
  summaryBox: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1' },
  summaryRow: { fontSize: 12, color: '#1e293b', marginBottom: 4 },
  boldText: { fontWeight: 'bold' },
  doctorHeader: { padding: 16, backgroundColor: '#0f172a', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  docHeaderTitle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  docHeaderSub: { color: '#94a3b8', fontSize: 11 },
  docExitBtn: { backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  queueCardDoctor: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 8 },
  queuePatientName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  queueBadgeRoutine: { fontSize: 10, backgroundColor: '#dcfce7', color: '#15803d', paddingHorizontal: 6, borderRadius: 4 },
  queuePatientMeta: { fontSize: 11, color: '#64748b', marginTop: 2 },
  queueSymptomText: { fontSize: 11, color: '#059669', fontStyle: 'italic', marginTop: 2 },
  consultDocBtn: { backgroundColor: '#059669', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  consultDocBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 11 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 10, padding: 16 },
  modalHeading: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  subtext: { fontSize: 11, color: '#64748b', marginBottom: 10 },
  emrEditInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, height: 90, fontSize: 12, textAlignVertical: 'top', marginBottom: 10 },
  fieldLabel: { fontSize: 11, fontWeight: 'bold', color: '#475569', marginBottom: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tagPill: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  tagText: { fontSize: 10, color: '#334155', fontWeight: 'bold' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 56, backgroundColor: '#ffffff', flexDirection: 'row', borderTopWidth: 1, borderColor: '#e2e8f0', justifyContent: 'space-around', alignItems: 'center' },
  navItem: { alignItems: 'center' },
  navIcon: { fontSize: 18 },
  navText: { fontSize: 10, color: '#64748b', fontWeight: 'bold' }
});