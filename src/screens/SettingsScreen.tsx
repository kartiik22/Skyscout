import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';

interface SettingsScreenProps {
  onClose: () => void;
  debugMode: boolean;
  onToggleDebug: (val: boolean) => void;
  minAltitude: number;
  onChangeMinAltitude: (val: number) => void;
  onOpenCalibration: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onClose,
  debugMode,
  onToggleDebug,
  minAltitude,
  onChangeMinAltitude,
  onOpenCalibration,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings & Sensors</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Sensor & Developer Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>DEVELOPER & TELEMETRY</Text>
          <View style={styles.row}>
            <View style={styles.labelCol}>
              <Text style={styles.itemTitle}>Developer Debug HUD</Text>
              <Text style={styles.itemSubtitle}>
                Overlay live GPS coordinates, raw sensor fusion, and FOV diagnostics
              </Text>
            </View>
            <Switch
              value={debugMode}
              onValueChange={onToggleDebug}
              trackColor={{ false: '#334155', true: '#0284C7' }}
              thumbColor={debugMode ? '#38BDF8' : '#94A3B8'}
            />
          </View>
        </View>

        {/* Compass Calibration */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>COMPASS CALIBRATION</Text>
          <TouchableOpacity style={styles.calibrationBtn} onPress={onOpenCalibration}>
            <View>
              <Text style={styles.itemTitle}>Recalibrate Compass</Text>
              <Text style={styles.itemSubtitle}>
                Clear magnetic distortion and align 9-axis sensor fusion
              </Text>
            </View>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* AI Astronomer Chatbot Status */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>AI CELESTIAL ASSISTANT</Text>
          <View style={styles.aiStatusCard}>
            <View style={styles.aiStatusHeader}>
              <Text style={styles.aiStatusIcon}>✨</Text>
              <Text style={styles.itemTitle}>Interactive Star Chatbot</Text>
            </View>
            <Text style={styles.itemSubtitle}>
              Tap any star in the sky view to open the AI Astronomer chat window. Supports OpenRouter LLM live inference with automatic offline astronomical lore fallback.
            </Text>
          </View>
        </View>

        {/* Sky Filter Thresholds */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>SKY VISIBILITY THRESHOLD</Text>
          <Text style={styles.itemSubtitle}>
            Minimum elevation above horizon: {minAltitude}°
          </Text>
          <View style={styles.altFilterRow}>
            {[0, 5, 10, 15].map((deg) => (
              <TouchableOpacity
                key={deg}
                style={[
                  styles.altPill,
                  minAltitude === deg && styles.altPillActive,
                ]}
                onPress={() => onChangeMinAltitude(deg)}
              >
                <Text
                  style={[
                    styles.altPillText,
                    minAltitude === deg && styles.altPillTextActive,
                  ]}
                >
                  +{deg}°
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* About SkyScout */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ABOUT SKYSCOUT</Text>
          <Text style={styles.aboutText}>
            Built for the Touch Grass Open-Source AI Hackathon.
          </Text>
          <Text style={styles.aboutSub}>
            Version 1.0.0 • Pure offline ephemeris • Local open-weight vision astrometry
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050714',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
  },
  closeText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeader: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelCol: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  itemSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  calibrationBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiStatusCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  aiStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiStatusIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  arrowText: {
    color: '#38BDF8',
    fontSize: 18,
    fontWeight: '700',
  },
  altFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  altPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  altPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  altPillText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  altPillTextActive: {
    color: '#FFFFFF',
  },
  aboutText: {
    color: '#E2E8F0',
    fontSize: 13,
    marginBottom: 4,
  },
  aboutSub: {
    color: '#64748B',
    fontSize: 11,
  },
});
