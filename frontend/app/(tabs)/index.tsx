import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, SafeAreaView, Modal, FlatList, Platform, Alert
} from 'react-native';
import { WebView } from 'react-native-webview';

const API_URL = 'https://ayush-backend-api.onrender.com/api/v1';

export default function AYUSHEnterprisePlatform() {
  // Navigation & Authentication
  const [step, setStep] = useState<'role_selection' | 'login' | 'verify_otp' | 'welcome' | 'link_mrn' | 'register_new' | 'dashboard'>('role_selection');
  const [loginRole, setLoginRole] = useState<'patient' | 'doctor'>('patient');
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [loginAbha, setLoginAbha] = useState('');
  const [patientLoginMethod, setPatientLoginMethod] = useState<'mobile' | 'abha'>('mobile');
  const [otpInput, setOtpInput] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [doctorId, setDoctorId] = useState('');
  const [doctorPwd, setDoctorPwd] = useState('');
  const [regName, setRegName] = useState('');
  const [regDob, setRegDob] = useState('');
  const [abhaInput, setAbhaInput] = useState('');

  // Primary Tabs & Drawer
  const [activeTab, setActiveTab] = useState<'home' | 'records' | 'telemed' | 'bills' | 'plans' | 'patients' | 'emr' | 'settings'>('home');
  const [menuOpen, setMenuOpen] = useState(false);

  // Live Database Collections
  const [appointments, setAppointments] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);

  // Enterprise Modals
  const [bookingModal, setBookingModal] = useState(false);
  const [bookingCategory, setBookingCategory] = useState('OPD');
  const [selectedSystem, setSelectedSystem] = useState('Ayurveda');
  const [selectedSpecialty, setSelectedSpecialty] = useState('Kayachikitsa');
  const [symptomInput, setSymptomInput] = useState('');

  const [recordsModal, setRecordsModal] = useState(false);
  const [depositModal, setDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('1000');

  // Doctor Clinical Workflows
  const [clinicalModal, setClinicalModal] = useState(false);
  const [clinicalToolType, setClinicalToolType] = useState<'prakriti' | 'nadi' | 'diet' | 'therapy' | 'emr'>('emr');
  const [selectedPatientForDoctor, setSelectedPatientForDoctor] = useState<any>(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [prakritiDosha, setPrakritiDosha] = useState({ vata: '30%', pitta: '45%', kapha: '25%' });
  const [nadiPulseRate, setNadiPulseRate] = useState('74 bpm (Mandooki Gati)');

  // Terminology Coding Search
  const [codingQuery, setCodingQuery] = useState('');
  const [codingResults, setCodingResults] = useState<any[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<any[]>([]);

  // Telemed Chat
  const [chatMessages, setChatMessages] = useState([{ sender: 'Ayush Telemed Gateway', text: 'Encrypted consultation session ready.' }]);
  const [chatInput, setChatInput] = useState('');

  // Data Sync
  const fetchAppointments = async () => {
    try {
      const abhaParam = userData?.role === 'patient' ? `?patient_abha=${userData.abha_number}` : '';
      const res = await fetch(`${API_URL}/appointments${abhaParam}`);
      const data = await res.json();
      if (Array.isArray(data)) setAppointments(data);
    } catch (e) {
      console.log('Database polling fallback active');
    }
  };

  const fetchRecords = async (abha: string) => {
    try {
      const res = await fetch(`${API_URL}/clinical/records/${abha}`);
      const data = await res.json();
      if (Array.isArray(data)) setMedicalRecords(data);
    } catch (e) {
      console.log('Record fetch error');
    }
  };

  const fetchDeposits = async (abha: string) => {
    try {
      const res = await fetch(`${API_URL}/billing/deposits/${abha}`);
      const data = await res.json();
      if (Array.isArray(data)) setDeposits(data);
    } catch (e) {
      console.log('Deposits fetch error');
    }
  };

  useEffect(() => {
    if (userData) {
      fetchAppointments();
      if (userData.role === 'patient') {
        fetchRecords(userData.abha_number);
        fetchDeposits(userData.abha_number);
      }
      const poll = setInterval(fetchAppointments, 4000);
      return () => clearInterval(poll);
    }
  }, [userData]);

  // Auth Operations
  const handlePatientLoginSubmit = () => {
    if (patientLoginMethod === 'mobile' && (!mobileNumber || mobileNumber.length < 10)) {
      return Alert.alert('Validation', 'Please enter a valid 10-digit mobile number.');
    }
    if (patientLoginMethod === 'abha' && (!loginAbha || loginAbha.length < 10)) {
      return Alert.alert('Validation', 'Please enter a valid ABHA Number.');
    }
    if (!agreed) return Alert.alert('Notice', 'Please accept the consent terms.');
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep('verify_otp'); }, 500);
  };

  const handleDoctorLoginSubmit = () => {
    if (!doctorId || !doctorPwd) return Alert.alert('Authentication', 'Please enter your Doctor ID and Password.');
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep('verify_otp'); }, 500);
  };

  const handleVerifyOTP = () => {
    if (!otpInput || otpInput.length < 4) return Alert.alert('Notice', 'Enter valid 4-digit code.');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (loginRole === 'doctor') {
        setUserData({ name: 'Dr. Sujai S', abha_number: 'HPR-9988-7766-2026', role: 'doctor' });
      } else {
        setUserData({ name: 'Nishanth S', abha_number: '33-8921-1234-2026', role: 'patient' });
      }
      setStep('dashboard');
    }, 500);
  };

  // Booking Creation
  const handleCreateAppointment = async () => {
    if (!symptomInput.trim()) return Alert.alert('Validation', 'Please describe the presenting symptoms.');
    setLoading(true);
    const newRecord = {
      id: `APT-${Date.now().toString().slice(-6)}`,
      patient_abha: userData.abha_number,
      patient_name: userData.name,
      doctor_name: 'Dr. Sujai S',
      system: selectedSystem,
      specialty: selectedSpecialty,
      symptoms: symptomInput,
      category: bookingCategory,
      scheduled_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    try {
      await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      });
      setBookingModal(false);
      setSymptomInput('');
      fetchAppointments();
      Alert.alert('Confirmed', 'Appointment successfully registered in hospital database.');
    } catch (e) {
      Alert.alert('Network Error', 'Unable to reach backend gateway.');
    }
    setLoading(false);
  };

  // Clinical Record Creation
  const handleSaveClinicalRecord = async () => {
    if (!selectedPatientForDoctor) return;
    setLoading(true);
    const clinicalPayload = {
      id: `REC-${Date.now().toString().slice(-6)}`,
      patient_abha: selectedPatientForDoctor.patient_abha,
      doctor_name: userData.name,
      record_type: clinicalToolType.toUpperCase(),
      title: `${selectedSystem} Consultation Note`,
      clinical_notes: doctorNotes,
      namaste_codes: selectedCodes.filter(c => c.system === 'Ayurveda'),
      icd11_codes: selectedCodes.filter(c => c.system === 'Allopathy'),
      vitals_prakriti: clinicalToolType === 'prakriti' ? prakritiDosha : { pulse: nadiPulseRate }
    };

    try {
      await fetch(`${API_URL}/clinical/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clinicalPayload)
      });
      await fetch(`${API_URL}/appointments/${selectedPatientForDoctor.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed' })
      });
      setClinicalModal(false);
      setDoctorNotes('');
      setSelectedCodes([]);
      fetchAppointments();
      Alert.alert('Success', 'EMR successfully saved and linked to patient health record.');
    } catch (e) {
      Alert.alert('Error', 'Failed to synchronize clinical record.');
    }
    setLoading(false);
  };

  // Deposit Handling
  const handleProcessDeposit = async () => {
    setLoading(true);
    const depositPayload = {
      id: `DEP-${Date.now().toString().slice(-6)}`,
      patient_abha: userData.abha_number,
      amount: parseInt(depositAmount) || 1000,
      payment_mode: 'UPI / BharatPe',
      reference_id: `TXN-${Math.random().toString(36).substring(7).toUpperCase()}`
    };

    try {
      await fetch(`${API_URL}/billing/deposits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(depositPayload)
      });
      setDepositModal(false);
      fetchDeposits(userData.abha_number);
      Alert.alert('Ledger Updated', `Advance deposit of ₹${depositAmount} recorded successfully.`);
    } catch (e) {
      Alert.alert('Error', 'Gateway error.');
    }
    setLoading(false);
  };

  // Terminology Engine Search
  const handleSearchCoding = async (text: string) => {
    setCodingQuery(text);
    if (text.length < 2) {
      setCodingResults([]);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/terminology/search?q=${text}`);
      const data = await res.json();
      setCodingResults(data);
    } catch (e) {
      console.log('Search error');
    }
  };

  // -----------------------------------------------------------
  // AUTHENTICATION FLOWS (100% PRESERVED VISUAL DESIGN)
  // -----------------------------------------------------------
  if (step === 'role_selection') {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <View style={styles.companyHeadingContainer}>
          <Text style={styles.companyHeadingText}>BINARY BRAINS SOLUTIONS</Text>
          <View style={styles.companyDivider} />
        </View>
        <View style={{ marginTop: 60, marginBottom: 40 }}>
          <Text style={styles.roleQuestionText}>Are you a patient or a doctor?</Text>
          <TouchableOpacity style={styles.largeRoleBtn} onPress={() => { setLoginRole('patient'); setStep('login'); }}>
            <Text style={styles.largeRoleIcon}>🧑‍🤝‍🧑</Text>
            <Text style={styles.largeRoleBtnText}>I am a Patient</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.largeRoleBtn} onPress={() => { setLoginRole('doctor'); setStep('login'); }}>
            <Text style={styles.largeRoleIcon}>🩺</Text>
            <Text style={styles.largeRoleBtnText}>I am a Doctor</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'login') {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <View style={styles.topNavRow}>
          <TouchableOpacity onPress={() => setStep('role_selection')}><Text style={styles.backArrow}>←</Text></TouchableOpacity>
          <Text style={styles.navTitle}>{loginRole === 'patient' ? 'Patient Portal' : 'Clinical Workspace'}</Text>
        </View>
        <View style={styles.companyHeadingContainer}>
          <Text style={styles.companyHeadingText}>BINARY BRAINS SOLUTIONS</Text>
          <View style={styles.companyDivider} />
        </View>
        {loginRole === 'patient' ? (
          <View style={{ width: '100%', marginTop: 20 }}>
            <Text style={styles.loginHeading}>Patient Login</Text>
            <View style={styles.methodToggleContainer}>
              <TouchableOpacity style={[styles.methodToggleBtn, patientLoginMethod === 'mobile' && styles.methodToggleBtnActive]} onPress={() => setPatientLoginMethod('mobile')}>
                <Text style={[styles.methodToggleText, patientLoginMethod === 'mobile' && styles.methodToggleTextActive]}>Mobile Number</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.methodToggleBtn, patientLoginMethod === 'abha' && styles.methodToggleBtnActive]} onPress={() => setPatientLoginMethod('abha')}>
                <Text style={[styles.methodToggleText, patientLoginMethod === 'abha' && styles.methodToggleTextActive]}>ABHA Number</Text>
              </TouchableOpacity>
            </View>
            {patientLoginMethod === 'mobile' ? (
              <View style={styles.inputWrapper}>
                <View style={styles.countryCodeBox}><Text style={styles.flagText}>🇮🇳 +91 ▾</Text></View>
                <TextInput style={styles.phoneInput} placeholder="Enter mobile number" keyboardType="phone-pad" maxLength={10} value={mobileNumber} onChangeText={setMobileNumber} />
              </View>
            ) : (
              <View style={styles.inputWrapper}>
                <View style={styles.countryCodeBox}><Text style={styles.flagText}>🪪 ABHA</Text></View>
                <TextInput style={styles.phoneInput} placeholder="e.g. 33-8921-1234-2026" value={loginAbha} onChangeText={setLoginAbha} />
              </View>
            )}
            <View style={styles.termsRow}>
              <TouchableOpacity onPress={() => setAgreed(!agreed)} style={styles.checkbox}>{agreed && <Text style={styles.checkmark}>✓</Text>}</TouchableOpacity>
              <Text style={styles.termsText}>I have read and agree to the <Text style={styles.linkText}>Terms</Text></Text>
            </View>
            <TouchableOpacity style={styles.otpButton} onPress={handlePatientLoginSubmit}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.otpButtonText}>Get OTP</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ width: '100%', marginTop: 20 }}>
            <Text style={styles.loginHeading}>Doctor Sign In</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.countryCodeBox}><Text style={styles.flagText}>👨‍⚕️ ID</Text></View>
              <TextInput style={styles.phoneInput} placeholder="Doctor ID" value={doctorId} onChangeText={setDoctorId} />
            </View>
            <View style={styles.inputWrapper}>
              <View style={styles.countryCodeBox}><Text style={styles.flagText}>🔒 PWD</Text></View>
              <TextInput style={styles.phoneInput} placeholder="Password" secureTextEntry value={doctorPwd} onChangeText={setDoctorPwd} />
            </View>
            <TouchableOpacity style={[styles.otpButton, { backgroundColor: '#0f172a' }]} onPress={handleDoctorLoginSubmit}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.otpButtonText}>Get OTP</Text>}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  if (step === 'verify_otp') {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <View style={styles.topNavRow}>
          <TouchableOpacity onPress={() => setStep('login')}><Text style={styles.backArrow}>←</Text></TouchableOpacity>
          <Text style={styles.navTitle}>Verification</Text>
        </View>
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 20 }}>💬</Text>
          <Text style={styles.loginHeading}>Enter OTP</Text>
          <Text style={{ textAlign: 'center', color: '#64748b', marginBottom: 30, paddingHorizontal: 20 }}>
            A simulation OTP code has been sent. (Type any 4 digits to proceed)
          </Text>
          <View style={[styles.inputWrapper, { width: '100%' }]}>
            <View style={styles.countryCodeBox}><Text style={styles.flagText}>🔑 OTP</Text></View>
            <TextInput style={[styles.phoneInput, { fontSize: 20, tracking: 4 }]} placeholder="----" keyboardType="number-pad" maxLength={6} value={otpInput} onChangeText={setOtpInput} />
          </View>
          <TouchableOpacity style={[styles.otpButton, loginRole === 'doctor' && { backgroundColor: '#0f172a' }, { width: '100%', marginTop: 20 }]} onPress={handleVerifyOTP}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.otpButtonText}>Verify & Proceed</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // -----------------------------------------------------------
  // DOCTOR DASHBOARD
  // -----------------------------------------------------------
  const isDoctor = userData?.role === 'doctor';

  if (isDoctor) {
    return (
      <SafeAreaView style={styles.dashContainerDoctor}>
        <View style={styles.patHeader}>
          <View style={styles.patHeaderLeft}>
            <TouchableOpacity onPress={() => setMenuOpen(true)}><Text style={styles.hamburger}>☰</Text></TouchableOpacity>
            <Text style={styles.patHeaderTitle}>{userData?.name} ▾</Text>
          </View>
          <Text style={styles.bell}>🔔</Text>
        </View>

        {/* Drawer Modal */}
        <Modal visible={menuOpen} animationType="slide" transparent={true}>
          <View style={styles.drawerOverlay}>
            <View style={styles.drawerContent}>
              <View style={[styles.drawerBlueHeader, { backgroundColor: '#0f172a' }]}>
                <View style={styles.drawerInitials}><Text style={[styles.drawerInitialsText, { color: '#0f172a' }]}>DR</Text></View>
                <Text style={styles.drawerUserName}>{userData?.name}</Text>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10 }}>
                <TouchableOpacity style={styles.drawerMenuItem}><Text style={styles.drawerMenuIcon}>📋</Text><Text style={styles.drawerMenuText}>My Master Schedule</Text></TouchableOpacity>
                <TouchableOpacity style={styles.drawerMenuItem}><Text style={styles.drawerMenuIcon}>🧑‍🤝‍🧑</Text><Text style={styles.drawerMenuText}>Hospital Registry</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.drawerMenuItem, { marginTop: 20, borderBottomWidth: 0 }]} onPress={() => { setMenuOpen(false); setStep('role_selection'); }}>
                  <Text style={styles.drawerMenuIcon}>🚪</Text>
                  <Text style={[styles.drawerMenuText, { color: '#e53e3e' }]}>Logout Workspace</Text>
                </TouchableOpacity>
              </ScrollView>
              <TouchableOpacity style={styles.drawerCloseBtn} onPress={() => setMenuOpen(false)}><Text style={styles.drawerCloseText}>Close</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Clinical Examination Modal */}
        <Modal visible={clinicalModal} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.sectionHeadingDoc}>
                {clinicalToolType === 'prakriti' && '🧬 Prakriti Diagnostic Assessment'}
                {clinicalToolType === 'nadi' && '🫀 Nadi Pariksha Pulse Analysis'}
                {clinicalToolType === 'diet' && '🥗 Ahara-Vihara Nutritional Rx'}
                {clinicalToolType === 'therapy' && '💆‍♂️ Panchakarma Therapy Order'}
                {clinicalToolType === 'emr' && `Clinical Consultation: ${selectedPatientForDoctor?.patient_name}`}
              </Text>
              <Text style={{ color: '#059669', marginBottom: 10, fontSize: 12 }}>
                Patient: {selectedPatientForDoctor ? `${selectedPatientForDoctor.patient_name} (${selectedPatientForDoctor.patient_abha})` : 'Walk-In Record'}
              </Text>

              {clinicalToolType === 'prakriti' && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.fieldLabel}>Dosha Distribution Analysis:</Text>
                  <TextInput style={styles.textInputFull} value={`Vata: ${prakritiDosha.vata} | Pitta: ${prakritiDosha.pitta} | Kapha: ${prakritiDosha.kapha}`} editable={false} />
                </View>
              )}

              {clinicalToolType === 'nadi' && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.fieldLabel}>Pulse Pattern (Gati & Vega):</Text>
                  <TextInput style={styles.textInputFull} value={nadiPulseRate} onChangeText={setNadiPulseRate} />
                </View>
              )}

              <Text style={styles.fieldLabel}>Clinical Assessment & Prescription Notes:</Text>
              <TextInput style={styles.inputNoteDoctor} placeholder="Write diagnostic formulation..." multiline value={doctorNotes} onChangeText={setDoctorNotes} />

              <Text style={styles.fieldLabel}>Diagnostic Autofill (NAMASTE / ICD-11):</Text>
              <TextInput style={[styles.textInputFull, { height: 42 }]} placeholder="Search diagnosis (e.g. Amavata, Arthritis)..." value={codingQuery} onChangeText={handleSearchCoding} />

              {codingResults.length > 0 && (
                <View style={styles.codingDropdown}>
                  {codingResults.map((item) => (
                    <TouchableOpacity key={item.code} style={styles.codingDropdownItem} onPress={() => { setSelectedCodes([...selectedCodes, item]); setCodingResults([]); setCodingQuery(''); }}>
                      <Text style={styles.codingCode}>{item.code}</Text>
                      <Text style={styles.codingLabel}>{item.label} ({item.system})</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.tagContainer}>
                {selectedCodes.map((c, i) => (
                  <View key={i} style={styles.codeTag}><Text style={styles.codeTagText}>{c.code}: {c.label}</Text></View>
                ))}
              </View>

              <TouchableOpacity style={styles.primaryDocButton} onPress={handleSaveClinicalRecord}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryDocButtonText}>Save Record to Registry</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => setClinicalModal(false)}>
                <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <ScrollView contentContainerStyle={styles.scrollContentDoctor} showsVerticalScrollIndicator={false}>
          {activeTab === 'home' && (
            <View>
              {/* Doctor Metric Row */}
              <View style={styles.docStatsRow}>
                <View style={styles.docStatCard}><Text style={styles.docStatNum}>{appointments.length}</Text><Text style={styles.docStatLabel}>Appointments</Text></View>
                <View style={styles.docStatCard}><Text style={styles.docStatNum}>{appointments.filter(a => a.status === 'Waiting').length}</Text><Text style={styles.docStatLabel}>Pending</Text></View>
                <View style={styles.docStatCard}><Text style={styles.docStatNum}>{appointments.filter(a => a.status === 'Completed').length}</Text><Text style={styles.docStatLabel}>Consulted</Text></View>
              </View>

              {/* AYUSH Clinical Tools */}
              <Text style={styles.sectionHeadingDoc}>AYUSH Clinical Tools</Text>
              <View style={styles.actionGridDoc}>
                <TouchableOpacity style={[styles.actionCardDoc, { backgroundColor: '#e0f2fe' }]} onPress={() => { setClinicalToolType('prakriti'); setClinicalModal(true); }}>
                  <Text style={styles.actionCardTitleDoc}>Prakriti{"\n"}Analysis</Text>
                  <Text style={styles.actionCardIconDoc}>🧬</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionCardDoc, { backgroundColor: '#fce7f3' }]} onPress={() => { setClinicalToolType('nadi'); setClinicalModal(true); }}>
                  <Text style={styles.actionCardTitleDoc}>Nadi{"\n"}Pariksha</Text>
                  <Text style={styles.actionCardIconDoc}>🫀</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionCardDoc, { backgroundColor: '#dcfce3' }]} onPress={() => { setClinicalToolType('diet'); setClinicalModal(true); }}>
                  <Text style={styles.actionCardTitleDoc}>Diet &{"\n"}Lifestyle</Text>
                  <Text style={styles.actionCardIconDoc}>🥗</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionCardDoc, { backgroundColor: '#ffedd5' }]} onPress={() => { setClinicalToolType('therapy'); setClinicalModal(true); }}>
                  <Text style={styles.actionCardTitleDoc}>Therapy{"\n"}Orders</Text>
                  <Text style={styles.actionCardIconDoc}>💆‍♂️</Text>
                </TouchableOpacity>
              </View>

              {/* Live Patient Queue */}
              <Text style={styles.sectionHeadingDoc}>Live Patient Queue (Tap to Consult)</Text>
              {appointments.length === 0 ? (
                <Text style={{ color: '#94a3b8', fontStyle: 'italic', marginVertical: 10 }}>No patients in consultation queue.</Text>
              ) : (
                appointments.map((patient) => (
                  <TouchableOpacity key={patient.id} style={styles.queueCard} onPress={() => { setSelectedPatientForDoctor(patient); setClinicalToolType('emr'); setClinicalModal(true); }}>
                    <View>
                      <Text style={styles.qName}>{patient.patient_name}</Text>
                      <Text style={styles.qTime}>{patient.scheduled_time} • ABHA: {patient.patient_abha}</Text>
                      <Text style={{ fontSize: 12, color: '#059669', marginTop: 4, fontStyle: 'italic' }}>{patient.specialty}: {patient.symptoms}</Text>
                    </View>
                    <View style={[styles.qStatusBox, patient.status === 'Waiting' ? { backgroundColor: '#fee2e2' } : { backgroundColor: '#dcfce7' }]}>
                      <Text style={[styles.qStatusText, patient.status === 'Waiting' ? { color: '#ef4444' } : { color: '#15803d' }]}>{patient.status}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {activeTab === 'telemed' && (
            <View style={{ flex: 1, height: 420 }}>
              <Text style={styles.sectionHeadingDoc}>Encrypted Teleconsultation Suite</Text>
              {Platform.OS === 'web' ? (
                <iframe src="https://meet.jit.si/BinaryBrainsAyushConsult" style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }} allow="camera; microphone; fullscreen; display-capture" />
              ) : (
                <WebView source={{ uri: 'https://meet.jit.si/BinaryBrainsAyushConsult' }} style={{ flex: 1, borderRadius: 12 }} allowsInlineMediaPlayback />
              )}
            </View>
          )}
        </ScrollView>

        {/* Doctor Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}><Text style={[styles.navIcon, activeTab === 'home' && { color: '#0f172a' }]}>🏠</Text><Text style={[styles.navText, activeTab === 'home' && { color: '#0f172a', fontWeight: 'bold' }]}>Home</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { setClinicalToolType('prakriti'); setClinicalModal(true); }}><Text style={styles.navIcon}>🧬</Text><Text style={styles.navText}>Prakriti</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('telemed')}><Text style={[styles.navIcon, activeTab === 'telemed' && { color: '#0f172a' }]}>📹</Text><Text style={[styles.navText, activeTab === 'telemed' && { color: '#0f172a', fontWeight: 'bold' }]}>Telemed</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { setMenuOpen(true); }}><Text style={styles.navIcon}>⚙️</Text><Text style={styles.navText}>Settings</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // -----------------------------------------------------------
  // PATIENT DASHBOARD
  // -----------------------------------------------------------
  return (
    <SafeAreaView style={styles.dashContainerPatient}>
      <View style={styles.patHeader}>
        <View style={styles.patHeaderLeft}>
          <TouchableOpacity onPress={() => setMenuOpen(true)}><Text style={styles.hamburger}>☰</Text></TouchableOpacity>
          <Text style={styles.patHeaderTitle}>Hello {userData?.name?.split(' ')[0] || 'Patient'} ▾</Text>
        </View>
        <Text style={styles.bell}>🔔</Text>
      </View>

      {/* Drawer Modal */}
      <Modal visible={menuOpen} animationType="slide" transparent={true}>
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerContent}>
            <View style={styles.drawerBlueHeader}>
              <View style={styles.drawerInitials}><Text style={styles.drawerInitialsText}>NU</Text></View>
              <Text style={styles.drawerUserName}>Hello {userData?.name || 'Patient'}</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10 }}>
              <TouchableOpacity style={styles.drawerMenuItem} onPress={() => { setMenuOpen(false); setActiveTab('records'); }}><Text style={styles.drawerMenuIcon}>💙</Text><Text style={styles.drawerMenuText}>My Health Records</Text></TouchableOpacity>
              <TouchableOpacity style={styles.drawerMenuItem} onPress={() => { setMenuOpen(false); setRecordsModal(true); }}><Text style={styles.drawerMenuIcon}>🧾</Text><Text style={styles.drawerMenuText}>My Bookings</Text></TouchableOpacity>
              <TouchableOpacity style={styles.drawerMenuItem} onPress={() => { setMenuOpen(false); setDepositModal(true); }}><Text style={styles.drawerMenuIcon}>📄</Text><Text style={styles.drawerMenuText}>Advance Deposits & Ledger</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.drawerMenuItem, { marginTop: 20, borderBottomWidth: 0 }]} onPress={() => { setMenuOpen(false); setStep('role_selection'); }}>
                <Text style={styles.drawerMenuIcon}>🚪</Text>
                <Text style={[styles.drawerMenuText, { color: '#e53e3e' }]}>Logout</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={styles.drawerCloseBtn} onPress={() => setMenuOpen(false)}><Text style={styles.drawerCloseText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Multi-Purpose Booking Modal */}
      <Modal visible={bookingModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.sectionHeadingDoc}>Schedule: {bookingCategory}</Text>
            <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 12 }}>Medical System: {selectedSystem} ({selectedSpecialty})</Text>

            <Text style={styles.fieldLabel}>Select Discipline:</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
              {['Ayurveda', 'Allopathy', 'Siddha'].map((s) => (
                <TouchableOpacity key={s} style={[styles.systemPill, selectedSystem === s && styles.systemPillActive]} onPress={() => setSelectedSystem(s)}>
                  <Text style={[styles.systemPillText, selectedSystem === s && styles.systemPillTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Chief Complaint & Symptoms:</Text>
            <TextInput style={styles.inputNoteDoctor} placeholder="Describe symptom duration, severity, and history..." multiline value={symptomInput} onChangeText={setSymptomInput} />

            <TouchableOpacity style={[styles.primaryDocButton, { backgroundColor: '#059669' }]} onPress={handleCreateAppointment}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryDocButtonText}>Confirm & Dispatch</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => setBookingModal(false)}>
              <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Advance Deposits Modal */}
      <Modal visible={depositModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.sectionHeadingDoc}>Advance Healthcare Deposit</Text>
            <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 12 }}>Secure wallet linked to ABHA ID.</Text>
            <Text style={styles.fieldLabel}>Deposit Amount (INR):</Text>
            <TextInput style={styles.textInputFull} keyboardType="numeric" value={depositAmount} onChangeText={setDepositAmount} />
            <TouchableOpacity style={[styles.primaryDocButton, { backgroundColor: '#059669' }]} onPress={handleProcessDeposit}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryDocButtonText}>Credit Wallet via UPI</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => setDepositModal(false)}>
              <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Patient Active Bookings Modal */}
      <Modal visible={recordsModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.sectionHeadingDoc}>My Active Bookings & Consultations</Text>
            <ScrollView>
              {appointments.map((a) => (
                <View key={a.id} style={styles.queueCard}>
                  <View>
                    <Text style={styles.qName}>{a.category} - {a.specialty}</Text>
                    <Text style={styles.qTime}>{a.scheduled_time} • {a.system}</Text>
                    <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{a.symptoms}</Text>
                  </View>
                  <View style={[styles.qStatusBox, { backgroundColor: '#dcfce7' }]}><Text style={styles.qStatusText}>{a.status}</Text></View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => setRecordsModal(false)}>
              <Text style={{ color: '#059669', fontWeight: 'bold' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        {activeTab === 'home' && (
          <View>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput style={styles.searchInput} placeholder="Search by Clinic or Doctor" placeholderTextColor="#a0aec0" />
            </View>

            {/* Quick Action Grid */}
            <View style={styles.actionGrid}>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#fef3c7' }]} onPress={() => { setBookingCategory('OPD Appointment'); setBookingModal(true); }}>
                <Text style={styles.actionCardTitle}>Book App{"\n"}ointment</Text>
                <Text style={styles.actionCardIcon}>🩺</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#ffedd5' }]} onPress={() => setActiveTab('telemed')}>
                <Text style={styles.actionCardTitle}>Video{"\n"}Consult</Text>
                <Text style={styles.actionCardIcon}>📱</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#dcfce3' }]} onPress={() => { setBookingCategory('Laboratory Panel & Checkups'); setBookingModal(true); }}>
                <Text style={styles.actionCardTitle}>Tests &{"\n"}Checkups</Text>
                <Text style={styles.actionCardIcon}>🌿</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionGrid}>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#e0e7ff' }]} onPress={() => setDepositModal(true)}>
                <Text style={styles.actionCardTitle}>Advance{"\n"}Deposits</Text>
                <Text style={styles.actionCardIcon}>💳</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#fae8ff' }]} onPress={() => setRecordsModal(true)}>
                <Text style={styles.actionCardTitle}>My{"\n"}Bookings</Text>
                <Text style={styles.actionCardIcon}>📋</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#fce7f3' }]} onPress={() => { setBookingCategory('Panchakarma Therapy Session'); setBookingModal(true); }}>
                <Text style={styles.actionCardTitle}>Therapy{"\n"}Bookings</Text>
                <Text style={styles.actionCardIcon}>💆</Text>
              </TouchableOpacity>
            </View>

            {/* Consult Doctor by Specialty Grid */}
            <Text style={styles.specialtyHeading}>Consult doctor by specialty</Text>
            <View style={styles.specialtyGrid}>
              {[
                { title: 'Ayurveda', icon: '🌿', spec: 'Kayachikitsa' },
                { title: 'Yoga &\nNaturopathy', icon: '🧘‍♀️', spec: 'Naturopathy' },
                { title: 'Unani', icon: '🍯', spec: 'Ilaj-bit-Tadbeer' },
                { title: 'Siddha', icon: '🍃', spec: 'Maruthuvam' },
                { title: 'Sowa\nRigpa', icon: '🏔️', spec: 'Sowa-Rigpa' },
                { title: 'Homoeopathy', icon: '💧', spec: 'Classical Homoeopathy' },
              ].map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.specialtyBox} onPress={() => { setSelectedSystem(item.title.replace('\n', ' ')); setSelectedSpecialty(item.spec); setBookingCategory('Specialty Intake'); setBookingModal(true); }}>
                  <View style={styles.specialtyIconBox}><Text style={styles.specialtyIconText}>{item.icon}</Text></View>
                  <Text style={styles.specialtyBoxText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => { setBookingCategory('AYUSH General Consultation'); setBookingModal(true); }}>
              <Text style={styles.viewAllText}>View all AYUSH specialities</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Records Vault */}
        {activeTab === 'records' && (
          <View style={{ padding: 16 }}>
            <Text style={styles.specialtyHeading}>Past Medical History (Digitized OCR Records)</Text>
            {medicalRecords.length === 0 ? (
              <View style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>Verified ABDM Vault</Text>
                  <Text style={styles.badgeGreen}>Digitized</Text>
                </View>
                <Text style={styles.historyTitle}>Amavata Baseline Evaluation</Text>
                <Text style={styles.historyText}>Diagnoses: Sandhivata, Agnimandya</Text>
                <Text style={styles.historyText}>Medications: Yogaraj Guggulu (2 tabs BD), Dashmularishta</Text>
                <View style={styles.recordImagePlaceholder}><Text style={{ color: '#64748b' }}>📄 [Digitized Prescription Artifact]</Text></View>
              </View>
            ) : (
              medicalRecords.map((r) => (
                <View key={r.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>{new Date(r.created_at).toLocaleDateString()}</Text>
                    <Text style={styles.badgeGreen}>{r.record_type}</Text>
                  </View>
                  <Text style={styles.historyTitle}>{r.title}</Text>
                  <Text style={styles.historyText}>{r.clinical_notes}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Telemedicine Room */}
        {activeTab === 'telemed' && (
          <View style={{ flex: 1, height: 420, paddingHorizontal: 16, marginTop: 10 }}>
            <Text style={styles.specialtyHeading}>Active Encrypted Telemedicine Room</Text>
            {Platform.OS === 'web' ? (
              <iframe src="https://meet.jit.si/BinaryBrainsAyushConsult" style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }} allow="camera; microphone; fullscreen; display-capture" />
            ) : (
              <WebView source={{ uri: 'https://meet.jit.si/BinaryBrainsAyushConsult' }} style={{ flex: 1, borderRadius: 12 }} allowsInlineMediaPlayback />
            )}
          </View>
        )}
      </ScrollView>

      {/* Patient Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}><Text style={[styles.navIcon, activeTab === 'home' && { color: '#059669' }]}>🏠</Text><Text style={[styles.navText, activeTab === 'home' && { color: '#059669', fontWeight: 'bold' }]}>Home</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('records')}><Text style={[styles.navIcon, activeTab === 'records' && { color: '#059669' }]}>❤️</Text><Text style={[styles.navText, activeTab === 'records' && { color: '#059669', fontWeight: 'bold' }]}>Records</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('telemed')}><Text style={[styles.navIcon, activeTab === 'telemed' && { color: '#059669' }]}>📹</Text><Text style={[styles.navText, activeTab === 'telemed' && { color: '#059669', fontWeight: 'bold' }]}>Telemed</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setDepositModal(true)}><Text style={styles.navIcon}>💳</Text><Text style={styles.navText}>Wallet</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// -----------------------------------------------------------
// EXACT VISUAL STYLESHEET
// -----------------------------------------------------------
const styles = StyleSheet.create({
  loginContainer: { flex: 1, backgroundColor: '#ffffff', paddingHorizontal: 20 },
  companyHeadingContainer: { alignItems: 'center', marginBottom: 25, marginTop: 40 },
  companyHeadingText: { fontSize: 22, fontWeight: '900', color: '#1e293b', letterSpacing: 1.5, textAlign: 'center' },
  companyDivider: { width: 40, height: 4, backgroundColor: '#059669', marginTop: 8, borderRadius: 2 },
  roleQuestionText: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginBottom: 24 },
  largeRoleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#cbd5e0', padding: 20, borderRadius: 12, marginBottom: 16 },
  largeRoleIcon: { fontSize: 28, marginRight: 16 },
  largeRoleBtnText: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  topNavRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  backArrow: { fontSize: 24, fontWeight: 'bold', color: '#1a202c', marginRight: 16 },
  navTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a202c' },
  loginHeading: { fontSize: 18, fontWeight: 'bold', color: '#1a202c', textAlign: 'center', marginBottom: 20 },
  methodToggleContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 4, marginBottom: 16 },
  methodToggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  methodToggleBtnActive: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  methodToggleText: { fontSize: 13, fontWeight: 'bold', color: '#64748b' },
  methodToggleTextActive: { color: '#059669' },
  inputWrapper: { flexDirection: 'row', borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 10, backgroundColor: '#f8f9fa', alignItems: 'center', marginBottom: 16, height: 50 },
  countryCodeBox: { paddingHorizontal: 14, borderRightWidth: 1, borderRightColor: '#cbd5e0', justifyContent: 'center' },
  flagText: { fontSize: 14, fontWeight: 'bold', color: '#2d3748' },
  phoneInput: { flex: 1, paddingHorizontal: 14, fontSize: 15, color: '#2d3748' },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingHorizontal: 4 },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: '#fff' },
  checkmark: { fontSize: 12, fontWeight: 'bold', color: '#059669' },
  termsText: { flex: 1, fontSize: 12, color: '#718096' },
  linkText: { color: '#059669', fontWeight: 'bold' },
  otpButton: { backgroundColor: '#059669', borderRadius: 25, height: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  otpButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },

  dashContainerDoctor: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContentDoctor: { padding: 16, paddingBottom: 80 },
  docStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  docStatCard: { backgroundColor: '#ffffff', width: '31%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  docStatNum: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  docStatLabel: { fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: '600' },
  sectionHeadingDoc: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 14, marginTop: 10 },
  actionGridDoc: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  actionCardDoc: { width: '48%', borderRadius: 12, padding: 14, height: 90, marginBottom: 12, justifyContent: 'space-between' },
  actionCardTitleDoc: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
  actionCardIconDoc: { fontSize: 26, alignSelf: 'flex-end' },
  queueCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  qName: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  qTime: { fontSize: 12, color: '#64748b', marginTop: 4 },
  qStatusBox: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  qStatusText: { fontSize: 11, fontWeight: 'bold' },
  inputNoteDoctor: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 8, padding: 12, height: 80, fontSize: 14, color: '#1e293b', textAlignVertical: 'top', marginBottom: 14 },
  primaryDocButton: { backgroundColor: '#0f172a', borderRadius: 8, padding: 14, alignItems: 'center' },
  primaryDocButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },

  dashContainerPatient: { flex: 1, backgroundColor: '#ffffff' },
  patHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
  patHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  hamburger: { fontSize: 24, color: '#1a202c', marginRight: 16 },
  patHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a202c' },
  bell: { fontSize: 18, color: '#eab308' },
  searchContainer: { flexDirection: 'row', backgroundColor: '#f8f9fa', marginHorizontal: 16, marginTop: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', paddingHorizontal: 14, height: 46 },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#2d3748' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: 10, justifyContent: 'space-between' },
  actionCard: { width: '31%', borderRadius: 12, padding: 12, height: 110, marginBottom: 12, justifyContent: 'space-between' },
  actionCardTitle: { fontSize: 13, fontWeight: 'bold', color: '#1a202c' },
  actionCardIcon: { fontSize: 32, alignSelf: 'flex-end' },
  specialtyHeading: { fontSize: 18, fontWeight: 'bold', color: '#1a202c', marginLeft: 16, marginTop: 20, marginBottom: 16 },
  specialtyGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, justifyContent: 'space-between' },
  specialtyBox: { width: '31%', backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 6, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#edf2f7', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  specialtyIconBox: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  specialtyIconText: { fontSize: 24 },
  specialtyBoxText: { fontSize: 12, fontWeight: '600', color: '#2d3748', textAlign: 'center', lineHeight: 16 },
  viewAllBtn: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
  viewAllText: { color: '#059669', fontWeight: 'bold', fontSize: 14 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 65, backgroundColor: '#ffffff', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e2e8f0', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 5 },
  navItem: { alignItems: 'center', flex: 1 },
  navIcon: { fontSize: 20, color: '#94a3b8' },
  navText: { fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: '600' },

  drawerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start' },
  drawerContent: { width: '80%', backgroundColor: '#ffffff', height: '100%' },
  drawerBlueHeader: { backgroundColor: '#059669', padding: 24, paddingTop: 40, flexDirection: 'row', alignItems: 'center' },
  drawerInitials: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  drawerInitialsText: { fontSize: 16, fontWeight: 'bold', color: '#059669' },
  drawerUserName: { color: '#ffffff', fontWeight: 'bold', fontSize: 20 },
  drawerMenuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  drawerMenuIcon: { fontSize: 18, width: 30, color: '#059669' },
  drawerMenuText: { fontSize: 15, fontWeight: '600', color: '#1e293b', flex: 1 },
  drawerCloseBtn: { padding: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  drawerCloseText: { fontSize: 15, fontWeight: 'bold', color: '#64748b' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#4a5568', marginBottom: 6 },
  textInputFull: { borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 10, backgroundColor: '#f8f9fa', paddingHorizontal: 14, height: 46, fontSize: 14, color: '#2d3748', marginBottom: 14 },
  systemPill: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, backgroundColor: '#f1f5f9' },
  systemPillActive: { backgroundColor: '#059669' },
  systemPillText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  systemPillTextActive: { color: '#ffffff' },

  historyCard: { backgroundColor: '#ffffff', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  historyDate: { fontSize: 12, color: '#64748b' },
  badgeGreen: { fontSize: 11, color: '#166534', backgroundColor: '#dcfce7', paddingHorizontal: 6, borderRadius: 4 },
  historyTitle: { fontWeight: 'bold', fontSize: 14, color: '#1e293b', marginBottom: 4 },
  historyText: { fontSize: 12, color: '#475569', marginBottom: 2 },
  recordImagePlaceholder: { marginTop: 8, backgroundColor: '#f1f5f9', height: 80, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },

  codingDropdown: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 6, marginBottom: 10 },
  codingDropdownItem: { padding: 8, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  codingCode: { fontSize: 11, fontWeight: 'bold', color: '#059669' },
  codingLabel: { fontSize: 12, color: '#1e293b' },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  codeTag: { backgroundColor: '#f1f5f9', borderRadius: 4, padding: 6, marginRight: 6, marginTop: 4 },
  codeTagText: { fontSize: 11, color: '#334155' }
});