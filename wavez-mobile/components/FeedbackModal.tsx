// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
// שימוש ב-X מהספרייה שעובדת
import { X } from 'lucide-react-native';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxtAE_t7Gfi7fkWtD5ZtFllLZObGMQNZ8FetvUchR_cNDgKRICOChXCdtvHuRSoqw/exec';

export default function FeedbackModal({ visible, onClose }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const sendFeedback = async () => {
    if (!name || !feedback) {
      Alert.alert('שגיאה', 'חובה למלא שם והערות');
      return;
    }

    setLoading(true);
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8', 
        },
        body: JSON.stringify({ name, phone, feedback }),
      });
      
      Alert.alert('תודה רבה!', 'הפידבק שלך התקבל בהצלחה.');
      setName('');
      setPhone('');
      setFeedback('');
      onClose();
    } catch (error) {
      Alert.alert('שגיאה', 'לא הצלחנו לשלוח את הפידבק, נסה שוב.');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          
          <View style={styles.header}>
            <Text style={styles.title}>נשמח לשמוע ממך 🌊</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>מצאת באג? יש לך רעיון? כתוב לנו!</Text>

          <TextInput
            style={styles.input}
            placeholder="שם מלא"
            placeholderTextColor="#64748b"
            value={name}
            onChangeText={setName}
            textAlign="right" // חשוב: יישור לימין
          />
          
          <TextInput
            style={styles.input}
            placeholder="טלפון (לא חובה)"
            placeholderTextColor="#64748b"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            textAlign="right" // חשוב: יישור לימין
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="?מה רצית לספר לנו"
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={4}
            value={feedback}
            onChangeText={setFeedback}
            textAlign="right" // חשוב: יישור לימין
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.sendButton} onPress={sendFeedback} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>שליחת פידבק</Text>
            )}
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row-reverse', // כדי שהכותרת תהיה מימין וה-X משמאל
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'right',
    marginBottom: 20,
    width: '100%',
  },
  input: {
    backgroundColor: '#0f172a',
    color: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#334155',
    textAlign: 'right', // גיבוי נוסף ליישור
  },
  textArea: {
    height: 100,
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});