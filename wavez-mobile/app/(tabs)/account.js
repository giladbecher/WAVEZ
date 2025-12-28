import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings } from 'lucide-react-native';

export default function AccountScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>החשבון שלי</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <User color="#38bdf8" size={48} />
          <Text style={styles.infoTitle}>WAVEZ Mobile</Text>
          <Text style={styles.infoSubtitle}>אפליקציית הגלישה החכמה</Text>
        </View>

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>תכונות זמינות</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>🏖️</Text>
              <Text style={styles.featureText}>מעקב אחר חופי גלישה</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>🌊</Text>
              <Text style={styles.featureText}>תחזיות גל בזמן אמת</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>🎯</Text>
              <Text style={styles.featureText}>תחזיות צפיפות חכמות</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>🗺️</Text>
              <Text style={styles.featureText}>מפה אינטראקטיבית</Text>
            </View>
          </View>
        </View>

        <View style={styles.versionCard}>
          <Text style={styles.versionText}>גרסה 1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 15,
    marginBottom: 5,
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  featuresCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 15,
    textAlign: 'right',
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureBullet: {
    fontSize: 16,
    marginLeft: 12,
    width: 20,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#cbd5e1',
    flex: 1,
    textAlign: 'right',
  },
  versionCard: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
});
