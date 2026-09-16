import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, SafeAreaView, Modal, FlatList, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const API_URL = 'https://ayush-backend-api.onrender.com/api/v1';

export default function AYUSHDualPortal() {
  // --- 1. ORIGINAL AUTH STATES ---
  const [step, setStep] = useState('role_selection');
  const [loginRole, setLoginRole] = useState('patient'); 
  const [patientLoginMethod, setPatientLoginMethod] = useState('mobile'); 
  const [mobileNumber, setMobileNumber] = useState('');
  const [loginAbha, setLoginAbha] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [agreed, setAgreed] = useState(false);
  
  const [doctorId, setDoctorId] = useState('');
  const [doctorPwd, setDoctorPwd] = useState('');
  
  const [abhaInput, setAbhaInput] = useState('');
  const [regName, setRegName] = useState('');
  const [regDob, setRegDob] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const [activeTab, setActiveTab] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Doctor EMR States
  const [note, setNote] = useState('');
  const [result, setResult] = useState<any>(null);
  const [parserLoading, setParserLoading] = useState(false);

  // --- 2. FAST FUNCTIONAL STATES ---
  const [liveAppointments, setLiveAppointments] = useState<any[]>([]);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingSymptoms, setBookingSymptoms] = useState('');
  
  const [emrModalVisible, setEmrModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  
  const [codingQuery, setCodingQuery] = useState('');
  const [codingResults, setCodingResults] = useState<any[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<any[]>([]);

  // --- 3. FAST SYNC LOGIC ---
  const fetchLiveDatabase = async () => {
    try {
      const abhaParam = userData?.role === 'patient' ? `?patient_abha=${userData.abha_number}` : '';
      const res = await fetch(`${API_URL}/db/appointments${abhaParam}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setLiveAppointments(data);
      }
    } catch (err) { console.log('Sync offline, using cache'); }
  };

  useEffect(() => {
    if (userData) {
      fetchLiveDatabase();
      const interval = setInterval(fetchLiveDatabase, 5000);
      return () => clearInterval(interval);
    }
  }, [userData]);

  // --- 4. ORIGINAL AUTHENTICATION PROCESSES ---
  const handlePatientLoginSubmit = () => {
    if (patientLoginMethod === 'mobile' && (!mobileNumber || mobileNumber.length < 10)) return alert("Please enter a valid 10-digit mobile number.");
    if (patientLoginMethod === 'abha' && (!loginAbha || loginAbha.length < 12)) return alert("Please enter a valid ABHA Number.");
    if (!agreed) return alert("Please agree to the Terms of Use.");
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep('verify_otp'); }, 600);
  };

  const handleDoctorLoginSubmit = () => {
    if (!doctorId || !doctorPwd) return alert("Enter valid credentials.");
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep('verify_otp'); }, 600);
  };

  const handleVerifyOTP = () => {
    if (!otpInput || otpInput.length < 4) return alert("Please enter the OTP.");
    setLoading(true);
    setTimeout(() => { 
      setLoading(false); 
      if (loginRole === 'doctor') {
        setUserData({ name: "Dr. Sujai S", abha_number: "HPR-9988", role: "doctor" });
        setStep('dashboard'); 
      } else {
        setStep('welcome'); 
      }
    }, 600);
  };

  const handleLinkABHA = () => {
    if (!abhaInput) return alert("Enter valid ABHA ID.");
    setLoading(true);
    setTimeout(() => { 
      setLoading(false); 
      setUserData({ name: "Linked User", abha_number: abhaInput, role: "patient" }); 
      setStep('dashboard'); 
    }, 800);
  };

  const handleRegisterNewMember = () => {
    if (!regName) return alert("Enter Name.");
    setLoading(true);
    setTimeout(() => { 
      setLoading(false); 
      setUserData({ name: regName, abha_number: `33-8921-1234-2026`, role: "patient" }); 
      setStep('dashboard'); 
    }, 800);
  };

  // --- 5. CLINICAL DATA PIPELINE ---
  const handleBookAppointment = async () => {
    setLoading(true);
    const newAppt = {
      id: `APT-${Math.random().toString(36).substring(7).toUpperCase()}`,
      patient_name: userData.name,
      patient_abha: userData.abha_number,
      doctor_name: 'Dr. Sujai S',
      specialty: 'General AYUSH',
      symptoms: bookingSymptoms,
      status: 'Waiting',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    try {
      await fetch(`${API_URL}/db/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppt)
      });
      alert('Success! Appointment dispatched to Doctor.');
    } catch (err) { 
      setLiveAppointments([newAppt, ...liveAppointments]);
      alert('Saved to local queue (Cloud disconnected).');
    }
    setBookingModalVisible(false);
    setBookingSymptoms('');
    fetchLiveDatabase();
    setLoading(false);
  };

  const handleOpenPatientEMR = async (patient: any) => {
    setSelectedPatient(patient);
    setEmrModalVisible(true);
    try {
      const res = await fetch(`${API_URL}/db/emr/${patient.patient_abha}`);
      const data = await res.json();
      setDoctorNotes(data.notes || '');
    } catch (err) { setDoctorNotes(''); }
  };

  const handleSaveEMR = async () => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/db/emr/${selectedPatient.patient_abha}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_notes: doctorNotes, diagnoses: selectedCodes })
      });
      alert('Patient data securely updated.');
    } catch (err) { alert('Saved locally.'); }
    setEmrModalVisible(false);
    setDoctorNotes('');
    setSelectedCodes([]);
    fetchLiveDatabase();
    setLoading(false);
  };

  const handleSearchCoding = async (text: string) => {
    setCodingQuery(text);
    if (text.length < 2) return setCodingResults([]);
    try {
      const res = await fetch(`${API_URL}/terminology/search?q=${text}`);
      setCodingResults(await res.json());
    } catch (err) { 
      setCodingResults([{code: 'NAM:AYU-01', label: 'Amavata (Rheumatoid)', system: 'Ayurveda'}]); 
    }
  };

  // --- ORIGINAL STATIC DATA PRESERVED ---
  const patientQuickActions = [
    { id: '1', title: 'Book App\nointment', icon: '🩺', bg: '#fef3c7', action: 'book' },
    { id: '2', title: 'Video\nConsult', icon: '📱', bg: '#ffedd5', action: 'telemed' },
    { id: '3', title: 'Tests &\nCheckups', icon: '🌿', bg: '#dcfce3', action: 'none' },
    { id: '4', title: 'Advance\nDeposits', icon: '💳', bg: '#e0e7ff', action: 'none' },
    { id: '5', title: 'My\nBookings', icon: '📋', bg: '#fae8ff', action: 'none' },
    { id: '6', title: 'Therapy\nBookings', icon: '💆', bg: '#fce7f3', action: 'none' },
  ];
  const specialties = [
    { id: '1', title: 'Ayurveda', icon: '🌿' }, { id: '2', title: 'Yoga &\nNaturopathy', icon: '🧘‍♀️' },
    { id: '3', title: 'Unani', icon: '🍯' }, { id: '4', title: 'Siddha', icon: '🍃' },
    { id: '5', title: 'Sowa\nRigpa', icon: '🏔️' }, { id: '6', title: 'Homoeopathy', icon: '💧' },
  ];
  const docQuickActions = [
    { id: '1', title: 'Prakriti\nAnalysis', icon: '🧬', bg: '#e0f2fe' }, { id: '2', title: 'Nadi\nPariksha', icon: '🫀', bg: '#fce7f3' },
    { id: '3', title: 'Diet &\nLifestyle', icon: '🥗', bg: '#dcfce3' }, { id: '4', title: 'Therapy\nOrders', icon: '💆‍♂️', bg: '#ffedd5', action: 'telemed' },
  ];

  // ==========================================
  // ORIGINAL UI SCREENS
  // ==========================================

  if (step === 'role_selection') {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <View style={styles.companyHeadingContainer}><Text style={styles.companyHeadingText}>BINARY BRAINS SOLUTIONS</Text><View style={styles.companyDivider} /></View>
        <View style={{marginTop: 60, marginBottom: 40}}>
          <Text style={styles.roleQuestionText}>Are you a patient or a doctor?</Text>
          <TouchableOpacity style={styles.largeRoleBtn} onPress={() => { setLoginRole('patient'); setStep('login'); }}><Text style={styles.largeRoleIcon}>🧑‍🤝‍🧑</Text><Text style={styles.largeRoleBtnText}>I am a Patient</Text></TouchableOpacity>
          <TouchableOpacity style={styles.largeRoleBtn} onPress={() => { setLoginRole('doctor'); setStep('login'); }}><Text style={styles.largeRoleIcon}>🩺</Text><Text style={styles.largeRoleBtnText}>I am a Doctor</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'login') {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <View style={styles.topNavRow}><TouchableOpacity onPress={() => setStep('role_selection')}><Text style={styles.backArrow}>←</Text></TouchableOpacity><Text style={styles.navTitle}>{loginRole === 'patient' ? 'Patient Portal' : 'Clinical Workspace'}</Text></View>
        <View style={styles.companyHeadingContainer}><Text style={styles.companyHeadingText}>BINARY BRAINS SOLUTIONS</Text><View style={styles.companyDivider} /></View>
        {loginRole === 'patient' ? (
          <View style={{width: '100%', marginTop: 20}}>
            <Text style={styles.loginHeading}>Patient Login</Text>
            <View style={styles.methodToggleContainer}>
              <TouchableOpacity style={[styles.methodToggleBtn, patientLoginMethod === 'mobile' && styles.methodToggleBtnActive]} onPress={() => setPatientLoginMethod('mobile')}><Text style={[styles.methodToggleText, patientLoginMethod === 'mobile' && styles.methodToggleTextActive]}>Mobile Number</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.methodToggleBtn, patientLoginMethod === 'abha' && styles.methodToggleBtnActive]} onPress={() => setPatientLoginMethod('abha')}><Text style={[styles.methodToggleText, patientLoginMethod === 'abha' && styles.methodToggleTextActive]}>ABHA Number</Text></TouchableOpacity>
            </View>
            {patientLoginMethod === 'mobile' ? (
              <View style={styles.inputWrapper}><View style={styles.countryCodeBox}><Text style={styles.flagText}>🇮🇳 +91 ▾</Text></View><TextInput style={styles.phoneInput} placeholder="Enter mobile number" keyboardType="phone-pad" value={mobileNumber} onChangeText={setMobileNumber} /></View>
            ) : (
              <View style={styles.inputWrapper}><View style={styles.countryCodeBox}><Text style={styles.flagText}>🪪 ABHA</Text></View><TextInput style={styles.phoneInput} placeholder="e.g. 33-8921-1234" value={loginAbha} onChangeText={setLoginAbha} /></View>
            )}
            <View style={styles.termsRow}><TouchableOpacity onPress={() => setAgreed(!agreed)} style={styles.checkbox}>{agreed && <Text style={styles.checkmark}>✓</Text>}</TouchableOpacity><Text style={styles.termsText}>I have read and agree to the <Text style={styles.linkText}>Terms</Text></Text></View>
            <TouchableOpacity style={styles.otpButton} onPress={handlePatientLoginSubmit}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.otpButtonText}>Get OTP</Text>}</TouchableOpacity>
          </View>
        ) : (
          <View style={{width: '100%', marginTop: 20}}>
            <Text style={styles.loginHeading}>Doctor Sign In</Text>
            <View style={styles.inputWrapper}><View style={styles.countryCodeBox}><Text style={styles.flagText}>👨‍⚕️ ID</Text></View><TextInput style={styles.phoneInput} placeholder="Doctor ID" value={doctorId} onChangeText={setDoctorId} /></View>
            <View style={styles.inputWrapper}><View style={styles.countryCodeBox}><Text style={styles.flagText}>🔒 PWD</Text></View><TextInput style={styles.phoneInput} placeholder="Password" secureTextEntry value={doctorPwd} onChangeText={setDoctorPwd} /></View>
            <TouchableOpacity style={[styles.otpButton, {backgroundColor: '#0f172a'}]} onPress={handleDoctorLoginSubmit}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.otpButtonText}>Get OTP</Text>}</TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  if (step === 'verify_otp') {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <View style={styles.topNavRow}><TouchableOpacity onPress={() => setStep('login')}><Text style={styles.backArrow}>←</Text></TouchableOpacity><Text style={styles.navTitle}>Verification</Text></View>
        <View style={{marginTop: 40, alignItems: 'center'}}>
          <Text style={{fontSize: 48, marginBottom: 20}}>💬</Text>
          <Text style={styles.loginHeading}>Enter OTP</Text>
          <Text style={{textAlign: 'center', color: '#64748b', marginBottom: 30, paddingHorizontal: 20}}>A simulation OTP code has been sent. (Type any 4 digits to proceed)</Text>
          <View style={[styles.inputWrapper, {width: '100%'}]}><View style={styles.countryCodeBox}><Text style={styles.flagText}>🔑 OTP</Text></View><TextInput style={[styles.phoneInput, {fontSize: 20, tracking: 4}]} placeholder="----" keyboardType="number-pad" maxLength={6} value={otpInput} onChangeText={setOtpInput} /></View>
          <TouchableOpacity style={[styles.otpButton, loginRole === 'doctor' && {backgroundColor: '#0f172a'}, {width: '100%', marginTop: 20}]} onPress={handleVerifyOTP}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.otpButtonText}>Verify & Proceed</Text>}</TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'welcome') {
    return (
      <SafeAreaView style={styles.screenContainer}>
        <View style={styles.topNavRow}><TouchableOpacity onPress={() => setStep('login')}><Text style={styles.backArrow}>←</Text></TouchableOpacity><Text style={styles.navTitle}>Welcome User</Text></View>
        <View style={styles.illBox}><Text style={styles.illSymbol}>📁➕</Text></View>
        <Text style={styles.instructionText}>If you are an existing patient with an ABHA ID, tap 'Link'.</Text>
        <TouchableOpacity style={styles.primaryButtonLarge} onPress={() => setStep('link_mrn')}><Text style={styles.primaryButtonLargeText}>Link using ABHA</Text></TouchableOpacity>
        <TouchableOpacity style={styles.outlineButtonLarge} onPress={() => setStep('register_new')}><Text style={styles.outlineButtonLargeText}>I am a new user</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (step === 'link_mrn') {
    return (
      <SafeAreaView style={styles.screenContainer}>
        <View style={styles.topNavRow}><TouchableOpacity onPress={() => setStep('welcome')}><Text style={styles.backArrow}>←</Text></TouchableOpacity><Text style={styles.navTitle}>Link Member</Text></View>
        <Text style={styles.fieldLabel}>Member ABHA ID *</Text>
        <TextInput style={styles.textInputFull} placeholder="Enter ABHA ID" value={abhaInput} onChangeText={setAbhaInput} />
        <TouchableOpacity style={[styles.primaryButtonLarge, {marginTop: 20}]} onPress={handleLinkABHA}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonLargeText}>Proceed</Text>}</TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (step === 'register_new') {
    return (
      <SafeAreaView style={styles.screenContainer}>
        <View style={styles.topNavRow}><TouchableOpacity onPress={() => setStep('welcome')}><Text style={styles.backArrow}>←</Text></TouchableOpacity><Text style={styles.navTitle}>Register New</Text></View>
        <Text style={styles.fieldLabel}>Name *</Text>
        <TextInput style={styles.textInputFull} placeholder="Name" value={regName} onChangeText={setRegName} />
        <Text style={styles.fieldLabel}>DOB *</Text>
        <TextInput style={styles.textInputFull} placeholder="DD/MM/YYYY" value={regDob} onChangeText={setRegDob} />
        <TouchableOpacity style={[styles.primaryButtonLarge, {marginTop: 20}]} onPress={handleRegisterNewMember}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonLargeText}>Submit</Text>}</TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ==========================================
  // DOCTOR DASHBOARD
  // ==========================================
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

        <Modal visible={menuOpen} animationType="slide" transparent={true}>
          <View style={styles.drawerOverlay}>
            <View style={styles.drawerContent}>
              <View style={[styles.drawerBlueHeader, {backgroundColor: '#0f172a'}]}>
                <View style={styles.drawerInitials}><Text style={[styles.drawerInitialsText, {color: '#0f172a'}]}>DR</Text></View>
                <Text style={styles.drawerUserName}>{userData?.name}</Text>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingTop: 10}}>
                <TouchableOpacity style={[styles.drawerMenuItem, {marginTop: 20, borderBottomWidth: 0}]} onPress={() => { setMenuOpen(false); setUserData(null); setStep('role_selection'); }}>
                  <Text style={styles.drawerMenuIcon}>🚪</Text>
                  <Text style={[styles.drawerMenuText, {color: '#e53e3e'}]}>Logout Workspace</Text>
                </TouchableOpacity>
              </ScrollView>
              <TouchableOpacity style={styles.drawerCloseBtn} onPress={() => setMenuOpen(false)}><Text style={styles.drawerCloseText}>Close</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* EMR Modal */}
        <Modal visible={emrModalVisible} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.sectionHeadingDoc}>Edit EMR: {selectedPatient?.patient_name}</Text>
              <Text style={{color: '#059669', marginBottom: 10, fontStyle: 'italic'}}>Patient Reported: {selectedPatient?.symptoms}</Text>
              
              <Text style={styles.fieldLabel}>Clinical Assessment & Prescription:</Text>
              <TextInput style={styles.inputNoteDoctor} placeholder="Enter observations..." multiline value={doctorNotes} onChangeText={setDoctorNotes} />
              
              <Text style={styles.fieldLabel}>Diagnostic Autofill (NAMASTE / ICD-11):</Text>
              <TextInput style={[styles.textInputFull, { height: 42, marginBottom: 4 }]} placeholder="Search diagnosis..." value={codingQuery} onChangeText={handleSearchCoding} />
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
                {selectedCodes.map((c, i) => ( <View key={i} style={styles.codeTag}><Text style={styles.codeTagText}>{c.code}</Text></View> ))}
              </View>

              <TouchableOpacity style={styles.primaryDocButton} onPress={handleSaveEMR}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryDocButtonText}>Save EMR to Cloud DB</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={{marginTop: 15, alignItems: 'center'}} onPress={() => setEmrModalVisible(false)}><Text style={{color: '#ef4444', fontWeight: 'bold'}}>Cancel</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        <ScrollView contentContainerStyle={styles.scrollContentDoctor} showsVerticalScrollIndicator={false}>
          {activeTab === 'home' && (
            <View>
              <View style={styles.docStatsRow}>
                <View style={styles.docStatCard}><Text style={styles.docStatNum}>{liveAppointments.length}</Text><Text style={styles.docStatLabel}>Appointments</Text></View>
                <View style={styles.docStatCard}><Text style={styles.docStatNum}>{liveAppointments.filter(a => a.status === 'Waiting').length}</Text><Text style={styles.docStatLabel}>Pending</Text></View>
                <View style={styles.docStatCard}><Text style={styles.docStatNum}>{liveAppointments.filter(a => a.status === 'Completed').length}</Text><Text style={styles.docStatLabel}>Consulted</Text></View>
              </View>

              <Text style={styles.sectionHeadingDoc}>AYUSH Clinical Tools</Text>
              <View style={styles.actionGridDoc}>
                {docQuickActions.map((item) => (
                  <TouchableOpacity key={item.id} style={[styles.actionCardDoc, {backgroundColor: item.bg}]} onPress={() => item.action ? setActiveTab(item.action) : null}>
                    <Text style={styles.actionCardTitleDoc}>{item.title}</Text>
                    <Text style={styles.actionCardIconDoc}>{item.icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionHeadingDoc}>Live Patient Queue</Text>
              {liveAppointments.length === 0 ? <Text style={{color: '#64748b', fontStyle: 'italic', marginBottom: 20}}>Queue empty. Waiting for patients.</Text> : null}
              {liveAppointments.map((patient) => (
                <TouchableOpacity key={patient.id} style={styles.queueCard} onPress={() => handleOpenPatientEMR(patient)}>
                  <View>
                    <Text style={styles.qName}>{patient.patient_name}</Text>
                    <Text style={styles.qTime}>{patient.time} • ABHA: {patient.patient_abha}</Text>
                    <Text style={{fontSize: 12, color: '#059669', marginTop: 4, fontStyle: 'italic'}}>{patient.symptoms}</Text>
                  </View>
                  <View style={[styles.qStatusBox, patient.status === 'Waiting' ? {backgroundColor: '#fee2e2'} : {backgroundColor: '#dcfce7'}]}>
                    <Text style={[styles.qStatusText, patient.status === 'Waiting' ? {color: '#ef4444'} : {color: '#15803d'}]}>{patient.status}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === 'telemed' && (
            <View style={{flex: 1, height: 420}}>
              <Text style={styles.sectionHeadingDoc}>Active Telemedicine Room</Text>
              {Platform.OS === 'web' ? (
                <iframe src="https://meet.jit.si/BinaryBrainsAyushConsult" style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }} allow="camera; microphone; fullscreen; display-capture" />
              ) : (
                <WebView source={{ uri: 'https://meet.jit.si/BinaryBrainsAyushConsult' }} style={{ flex: 1, borderRadius: 12 }} allowsInlineMediaPlayback />
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}><Text style={[styles.navIcon, activeTab === 'home' && {color: '#0f172a'}]}>🏠</Text><Text style={[styles.navText, activeTab === 'home' && {color: '#0f172a', fontWeight: 'bold'}]}>Home</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navItem}><Text style={styles.navIcon}>🧑‍🤝‍🧑</Text><Text style={styles.navText}>Patients</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('telemed')}><Text style={[styles.navIcon, activeTab === 'telemed' && {color: '#0f172a'}]}>📹</Text><Text style={[styles.navText, activeTab === 'telemed' && {color: '#0f172a', fontWeight: 'bold'}]}>Telemed</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navItem}><Text style={styles.navIcon}>⚙️</Text><Text style={styles.navText}>Settings</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // PATIENT DASHBOARD
  // ==========================================
  return (
    <SafeAreaView style={styles.dashContainerPatient}>
      <View style={styles.patHeader}>
        <View style={styles.patHeaderLeft}>
          <TouchableOpacity onPress={() => setMenuOpen(true)}><Text style={styles.hamburger}>☰</Text></TouchableOpacity>
          <Text style={styles.patHeaderTitle}>Hello {userData?.name?.split(' ')[0] || 'User'} ▾</Text>
        </View>
        <Text style={styles.bell}>🔔</Text>
      </View>

      <Modal visible={menuOpen} animationType="slide" transparent={true}>
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerContent}>
            <View style={styles.drawerBlueHeader}>
              <View style={styles.drawerInitials}><Text style={styles.drawerInitialsText}>NU</Text></View>
              <Text style={styles.drawerUserName}>Hello {userData?.name || 'User'}</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingTop: 10}}>
              <TouchableOpacity style={[styles.drawerMenuItem, {marginTop: 20, borderBottomWidth: 0}]} onPress={() => { setMenuOpen(false); setUserData(null); setStep('role_selection'); }}>
                <Text style={styles.drawerMenuIcon}>🚪</Text>
                <Text style={[styles.drawerMenuText, {color: '#e53e3e'}]}>Logout</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={styles.drawerCloseBtn} onPress={() => setMenuOpen(false)}><Text style={styles.drawerCloseText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Booking Form Modal */}
      <Modal visible={bookingModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.sectionHeadingDoc}>Book Live Appointment</Text>
            <Text style={styles.fieldLabel}>Describe Symptoms:</Text>
            <TextInput style={styles.inputNoteDoctor} placeholder="E.g., Severe joint pain..." multiline value={bookingSymptoms} onChangeText={setBookingSymptoms} />
            <TouchableOpacity style={[styles.primaryDocButton, {backgroundColor: '#059669'}]} onPress={handleBookAppointment}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryDocButtonText}>Confirm & Book</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={{marginTop: 15, alignItems: 'center'}} onPress={() => setBookingModalVisible(false)}><Text style={{color: '#ef4444', fontWeight: 'bold'}}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{paddingBottom: 80}} showsVerticalScrollIndicator={false}>
        {activeTab === 'home' && (
          <View>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput style={styles.searchInput} placeholder="Search by Clinic or Doctor" placeholderTextColor="#a0aec0" />
            </View>

            <View style={styles.actionGrid}>
              {patientQuickActions.map((item) => (
                <TouchableOpacity key={item.id} style={[styles.actionCard, {backgroundColor: item.bg}]} onPress={() => { if(item.action === 'book') setBookingModalVisible(true); else if(item.action === 'telemed') setActiveTab('telemed'); }}>
                  <Text style={styles.actionCardTitle}>{item.title}</Text>
                  <Text style={styles.actionCardIcon}>{item.icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.specialtyHeading}>Consult doctor by specialty</Text>
            <View style={styles.specialtyGrid}>
              {specialties.map((item) => (
                <TouchableOpacity key={item.id} style={styles.specialtyBox}>
                  <View style={styles.specialtyIconBox}><Text style={styles.specialtyIconText}>{item.icon}</Text></View>
                  <Text style={styles.specialtyBoxText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.viewAllBtn}><Text style={styles.viewAllText}>View all AYUSH specialities</Text></TouchableOpacity>
          </View>
        )}

        {activeTab === 'telemed' && (
          <View style={{flex: 1, height: 420, paddingHorizontal: 16, marginTop: 10}}>
            <Text style={styles.specialtyHeading}>Secure Telemedicine Room</Text>
            {Platform.OS === 'web' ? (
              <iframe src="https://meet.jit.si/BinaryBrainsAyushConsult" style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }} allow="camera; microphone; fullscreen; display-capture" />
            ) : (
              <WebView source={{ uri: 'https://meet.jit.si/BinaryBrainsAyushConsult' }} style={{ flex: 1, borderRadius: 12 }} allowsInlineMediaPlayback />
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}><Text style={[styles.navIcon, activeTab === 'home' && {color: '#059669'}]}>🏠</Text><Text style={[styles.navText, activeTab === 'home' && {color: '#059669', fontWeight: 'bold'}]}>Home</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Text style={styles.navIcon}>❤️</Text><Text style={styles.navText}>Records</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('telemed')}><Text style={[styles.navIcon, activeTab === 'telemed' && {color: '#059669'}]}>📹</Text><Text style={[styles.navText, activeTab === 'telemed' && {color: '#059669', fontWeight: 'bold'}]}>Telemed</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Text style={styles.navIcon}>🌿</Text><Text style={styles.navText}>Plans</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// 100% ORIGINAL STYLESHEET
// ==========================================
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
  screenContainer: { flex: 1, backgroundColor: '#ffffff', padding: 20 },
  illBox: { alignItems: 'center', marginVertical: 20 },
  illSymbol: { fontSize: 36, marginBottom: 8 },
  instructionText: { fontSize: 13, color: '#4a5568', lineHeight: 20, marginBottom: 30, textAlign: 'center' },
  primaryButtonLarge: { backgroundColor: '#0056b3', borderRadius: 25, height: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  primaryButtonLargeText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  outlineButtonLarge: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#0056b3', borderRadius: 25, height: 50, justifyContent: 'center', alignItems: 'center' },
  outlineButtonLargeText: { color: '#0056b3', fontWeight: 'bold', fontSize: 15 },
  infoBox: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', padding: 12, borderRadius: 8, marginBottom: 20 },
  infoText: { fontSize: 12, color: '#166534', lineHeight: 18 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#4a5568', marginBottom: 6 },
  textInputFull: { borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 10, backgroundColor: '#f8f9fa', paddingHorizontal: 14, height: 50, fontSize: 14, color: '#2d3748', marginBottom: 16 },

  dashContainerDoctor: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContentDoctor: { padding: 16, paddingBottom: 80 },
  docStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  docStatCard: { backgroundColor: '#ffffff', width: '31%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 3, elevation: 1 },
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
  parserCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginTop: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  parserTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
  inputNoteDoctor: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 8, padding: 12, height: 120, fontSize: 14, color: '#1e293b', textAlignVertical: 'top', marginBottom: 14 },
  primaryDocButton: { backgroundColor: '#0f172a', borderRadius: 8, padding: 14, alignItems: 'center' },
  primaryDocButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  resultBox: { marginTop: 14, backgroundColor: '#1e293b', borderRadius: 8, padding: 12 },
  successText: { color: '#4ade80', fontWeight: 'bold', fontSize: 12, marginBottom: 6 },
  jsonText: { fontFamily: 'monospace', fontSize: 10, color: '#38bdf8' },

  dashContainerPatient: { flex: 1, backgroundColor: '#ffffff' },
  patHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
  patHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  hamburger: { fontSize: 24, color: '#1a202c', marginRight: 16 },
  patHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a202c' },
  bell: { fontSize: 18, color: '#eab308' },
  searchContainer: { flexDirection: 'row', backgroundColor: '#f8f9fa', marginHorizontal: 16, marginTop: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', paddingHorizontal: 14, height: 46 },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#2d3748' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: 20, justifyContent: 'space-between' },
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
  codingDropdown: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 6, marginBottom: 10 },
  codingDropdownItem: { padding: 8, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  codingCode: { fontSize: 11, fontWeight: 'bold', color: '#059669' },
  codingLabel: { fontSize: 12, color: '#1e293b' },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  codeTag: { backgroundColor: '#f1f5f9', borderRadius: 4, padding: 6, marginRight: 6, marginTop: 4 },
  codeTagText: { fontSize: 11, color: '#334155' }
});