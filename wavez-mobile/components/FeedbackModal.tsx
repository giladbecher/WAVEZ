// @ts-nocheck
import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxtAE_t7Gfi7fkWtD5ZtFllLZObGMQNZ8FetvUchR_cNDgKRICOChXCdtvHuRSoqw/exec';

export default function FeedbackModal({ visible, onClose }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  const sendFeedback = async () => {
    if (!name || !feedback) {
      Alert.alert('שגיאה', 'חובה למלא שם והערות');
      return;
    }

    setLoading(true);
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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
    <View style={styles.rootOverlay} pointerEvents="box-none">
      {/* 
        BACKDROP
        - Absolute fill to cover screen.
        - Closes modal on press.
      */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* 
        MODAL CONTENT
        - Position absolute + Top offset (instead of Flexbox).
        - This prevents the modal from jumping/shifting when the keyboard 
          resizes the viewport height, preserving input focus.
        - 'pointerEvents="auto"' ensures touches are caught here and don't leak to backdrop.
      */}
      <View style={styles.modalContent} pointerEvents="auto">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>נשמח לשמוע ממך 🌊 (v5)</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>מצאת באג? יש לך רעיון? כתוב לנו!</Text>

        {/* Inputs */}
        <TextInput
          style={styles.input}
          placeholder="שם מלא"
          placeholderTextColor="#64748b"
          value={name}
          onChangeText={setName}
          textAlign="right"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="טלפון (לא חובה)"
          placeholderTextColor="#64748b"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          textAlign="right"
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="?מה רצית לספר לנו"
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={4}
          value={feedback}
          onChangeText={setFeedback}
          textAlign="right"
          textAlignVertical="top"
          scrollEnabled={false} // Prevents scroll conflicts inside modal
        />

        {/* Send Button */}
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendFeedback}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>שליחת פידבק</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootOverlay: {
    // This container sits over the whole screen.
    // On Web, 'fixed' ensures it ignores scroll.
    ...Platform.select({
      ios: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        zIndex: 1000,
      },
      android: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        zIndex: 1000,
      },
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        // Using 100vw/150vh ensures the overlay is larger than the screen
        // and doesn't resize/recalculate when the address bar shrinks
        // or the keyboard slides up.
        width: '100vw',
        height: '150vh',
        zIndex: 1000,
      }
    }),
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 1,
  },
  modalContent: {
    // Positioning strategy: Absolute Top-Centered.
    // We avoid 'flex: 1' or 'justifyContent: center' on the parent
    // to prevent layout shifts when the keyboard collapses the viewport.
    position: 'absolute',
    top: '15%', // Stable top offset
    alignSelf: 'center',

    width: '90%',
    maxWidth: 400,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    zIndex: 2,

    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row-reverse',
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
    textAlign: 'right',
    fontSize: 16,
    // Fixes for iOS input appearance
    minHeight: 45,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
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