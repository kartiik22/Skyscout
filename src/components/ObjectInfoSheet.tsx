import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SkyObject } from '../types/astronomy';
import { HapticsService } from '../sensors/HapticsService';

interface ObjectInfoSheetProps {
  object: SkyObject | null;
  onClose: () => void;
  onStartMission?: (obj: SkyObject) => void;
  onOpenChat?: (obj: SkyObject) => void;
}

export const ObjectInfoSheet: React.FC<ObjectInfoSheetProps> = ({
  object,
  onClose,
  onStartMission,
  onOpenChat,
}) => {
  if (!object) return null;

  const handleStartMission = () => {
    HapticsService.triggerClick();
    if (onStartMission) {
      onStartMission(object);
    }
  };

  return (
    <View style={styles.sheetContainer}>
      <View style={styles.grabber} />

      <View style={styles.headerRow}>
        <View style={styles.titleArea}>
          <View style={styles.nameRow}>
            <Text style={styles.objectIcon}>
              {object.type === 'planet' ? '🪐' : '⭐'}
            </Text>
            <Text style={styles.title}>{object.name}</Text>
          </View>
          {object.latinName && (
            <Text style={styles.latinName}>{object.latinName}</Text>
          )}
        </View>

        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Metric Badges */}
        <View style={styles.metricGrid}>
          {object.distanceLightYears && (
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>DISTANCE</Text>
              <Text style={styles.metricValue}>{object.distanceLightYears} ly</Text>
            </View>
          )}

          {object.constellationName && (
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>CONSTELLATION</Text>
              <Text style={styles.metricValue} numberOfLines={1}>
                {object.constellationName}
              </Text>
            </View>
          )}

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>MAGNITUDE</Text>
            <Text style={styles.metricValue}>{object.magnitude}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>ALTITUDE</Text>
            <Text style={styles.metricValue}>{Math.round(object.altitude)}°</Text>
          </View>
        </View>

        {/* Astronomical description */}
        <Text style={styles.descriptionText}>{object.description}</Text>

        {object.mythology && (
          <View style={styles.loreBox}>
            <Text style={styles.loreTitle}>Mythology & Heritage</Text>
            <Text style={styles.loreText}>{object.mythology}</Text>
          </View>
        )}

        {/* Touch Grass Mission Callout */}
        <View style={styles.touchGrassCard}>
          <View style={styles.touchGrassHeader}>
            <Text style={styles.touchGrassIcon}>🌱</Text>
            <Text style={styles.touchGrassTitle}>TOUCH GRASS MISSION</Text>
          </View>
          <Text style={styles.touchGrassSubtitle}>
            Find {object.name} with your own eyes. Put your phone down and look toward the {Math.round(object.altitude)}° elevation mark in the sky.
          </Text>
        </View>

        {/* Action Buttons: Ask AI & Touch Grass Mission */}
        <View style={styles.actionRow}>
          {onOpenChat && (
            <TouchableOpacity
              style={styles.chatActionBtn}
              activeOpacity={0.8}
              onPress={() => {
                HapticsService.triggerClick();
                onOpenChat(object);
              }}
            >
              <Text style={styles.chatActionIcon}>💬</Text>
              <Text style={styles.chatActionText}>Ask AI Astronomer</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.missionActionBtn, onOpenChat && { flex: 1 }]}
            activeOpacity={0.8}
            onPress={handleStartMission}
          >
            <Text style={styles.missionActionText}>Track with Haptic Guide</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '65%',
    backgroundColor: 'rgba(10, 15, 30, 0.94)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 25,
  },
  grabber: {
    width: 44,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  titleArea: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  objectIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  latinName: {
    color: '#94A3B8',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
    marginLeft: 28,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 0,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '700',
  },
  descriptionText: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  loreBox: {
    backgroundColor: 'rgba(24, 24, 45, 0.75)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#818CF8',
  },
  loreTitle: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  loreText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
  },
  touchGrassCard: {
    backgroundColor: 'rgba(12, 45, 30, 0.65)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    marginBottom: 10,
  },
  touchGrassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  touchGrassIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  touchGrassTitle: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  touchGrassSubtitle: {
    color: '#D1FAE5',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    marginBottom: 32,
  },
  chatActionBtn: {
    flex: 1.1,
    flexDirection: 'row',
    backgroundColor: '#0284C7',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38BDF8',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  chatActionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  chatActionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  missionActionBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  missionActionText: {
    color: '#6EE7B7',
    fontWeight: '700',
    fontSize: 12,
  },
});
