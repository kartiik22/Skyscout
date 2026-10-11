import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';
import { useLocation } from '../hooks/useLocation';
import { useVisibleStars } from '../hooks/useVisibleStars';
import { SkyOverlay } from '../components/SkyOverlay';
import { CompassIndicator } from '../components/CompassIndicator';
import { ObjectInfoSheet } from '../components/ObjectInfoSheet';
import { DebugOverlay } from '../components/DebugOverlay';
import { CalibrationModal } from '../components/CalibrationModal';
import { StarChatModal } from '../components/StarChatModal';
import { HapticsService } from '../sensors/HapticsService';
import { angularDistanceDeg } from '../astronomy/CoordinateTransform';
import { SkyObject, TouchGrassMission, DeviceOrientation, ObserverLocation } from '../types/astronomy';
import { LocalAIProvider } from '../ai/LocalAIProvider';

interface StargazingScreenProps {
  onBackToHome: () => void;
  onOpenSettings: () => void;
  onOpenMissions: () => void;
  debugMode: boolean;
  onToggleDebug: (val: boolean) => void;
  minAltitude: number;
  activeMission?: TouchGrassMission | null;
  onCompleteMission?: () => void;
  onCancelMission?: () => void;
}

export const StargazingScreen: React.FC<StargazingScreenProps> = ({
  onBackToHome,
  onOpenSettings,
  onOpenMissions,
  debugMode,
  onToggleDebug,
  minAltitude,
  activeMission,
  onCancelMission,
}) => {
  // 1. Camera Permissions
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // 2. Manual debug simulation state
  const [manualOrientation, setManualOrientation] = useState<Partial<DeviceOrientation> | null>(null);
  const [simulatedDate, setSimulatedDate] = useState<Date | null>(null);

  // 3. Sensors, Location & Astronomy
  const orientation = useDeviceOrientation(manualOrientation);
  const { location } = useLocation();
  const { visibleStars, constellations, solarStatus, currentTime } = useVisibleStars(
    location,
    simulatedDate,
    minAltitude
  );

  // 4. Object selection & UI modals
  const [selectedObject, setSelectedObject] = useState<SkyObject | null>(null);
  const [calibrationVisible, setCalibrationVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiResultText, setAiResultText] = useState<string | null>(null);

  const aiProvider = useRef(new LocalAIProvider()).current;

  // 5. Haptic proximity guidance for Active Mission
  const missionTargetObject = activeMission
    ? visibleStars.find((o) => o.id === activeMission.targetObjectId)
    : null;

  const targetAngularDist = missionTargetObject
    ? angularDistanceDeg(
        orientation.altitude,
        orientation.azimuth,
        missionTargetObject.altitude,
        missionTargetObject.azimuth
      )
    : undefined;

  useEffect(() => {
    if (targetAngularDist !== undefined) {
      HapticsService.triggerTargetProximity(targetAngularDist);
    }
  }, [targetAngularDist]);

  // Request camera permission on mount if needed
  useEffect(() => {
    if (cameraPermission && !cameraPermission.granted && cameraPermission.canAskAgain) {
      requestCameraPermission();
    }
  }, [cameraPermission]);

  // Trigger Local AI Identification & Open Chatbot
  const handleTriggerAiScan = async () => {
    HapticsService.triggerClick();
    setIsAiScanning(true);
    setAiResultText(null);

    try {
      const res = await aiProvider.identifySkyObject({
        location,
        orientation,
        timestamp: Date.now(),
        candidateObjects: visibleStars,
      });

      let targetStar = selectedObject;
      if (res.matchedObjectId) {
        const found = visibleStars.find((o) => o.id === res.matchedObjectId);
        if (found) {
          targetStar = found;
          setSelectedObject(found);
        }
      } else if (!targetStar && visibleStars.length > 0) {
        // Fallback to the brightest or nearest visible star
        targetStar = visibleStars[0];
        setSelectedObject(targetStar);
      }

      setAiResultText(`${res.provider} (${res.latencyMs}ms): ${res.description}`);
      HapticsService.triggerSuccess();

      // Automatically launch the interactive AI Astronomer Chatbot window!
      setTimeout(() => {
        setChatModalVisible(true);
      }, 400);
    } catch {
      Alert.alert('AI Analysis', 'Unable to resolve optical boresight.');
    } finally {
      setIsAiScanning(false);
    }
  };

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <View style={styles.container}>
      {/* CAMERA BACKGROUND */}
      {cameraPermission?.granted ? (
        <CameraView style={StyleSheet.absoluteFill} facing="back" />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.cameraFallback]}>
          <Text style={styles.fallbackIcon}>🔭</Text>
          <Text style={styles.fallbackTitle}>Camera Inactive or Simulator</Text>
          <Text style={styles.fallbackSubtitle}>
            Rendering celestial coordinate projection and real sensor fusion view.
          </Text>
          {!cameraPermission?.granted && (
            <TouchableOpacity style={styles.permBtn} onPress={requestCameraPermission}>
              <Text style={styles.permBtnText}>Grant Camera Permission</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* DAYLIGHT WARNING BANNER */}
      {solarStatus.isDaytime && (
        <View style={styles.daytimeBanner}>
          <Text style={styles.daytimeText}>
            ☀️ Daytime ({Math.round(solarStatus.sunAltitude)}° Sun). Stars shown in transparent celestial simulation mode.
          </Text>
        </View>
      )}

      {/* CELESTIAL CAMERA AR OVERLAY */}
      <SkyOverlay
        objects={visibleStars}
        constellations={constellations}
        orientation={orientation}
        selectedObjectId={selectedObject?.id}
        targetMissionObjectId={activeMission?.targetObjectId}
        onSelectObject={(obj) => {
          HapticsService.triggerClick();
          if (selectedObject?.id === obj.id) {
            // Tapping selected star again opens the AI chat immediately
            setChatModalVisible(true);
          } else {
            setSelectedObject(obj);
          }
        }}
      />

      {/* TOP NAVIGATION / STATUS BAR */}
      <View style={styles.topBar}>
        <View style={styles.topInfo}>
          <TouchableOpacity onPress={onBackToHome} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.appTitle}>SkyScout</Text>
            <Text style={styles.locationSubtitle}>
              📍 {location.city || 'Delhi'} • {formattedTime}
            </Text>
          </View>
        </View>

        <View style={styles.topActions}>
          <CompassIndicator
            heading={orientation.azimuth}
            altitude={orientation.altitude}
            confidence={orientation.headingConfidence}
          />
        </View>
      </View>

      {/* ACTIVE MISSION NOTIFICATION HUD */}
      {activeMission && (
        <View style={styles.activeMissionBar}>
          <View style={styles.missionTextCol}>
            <Text style={styles.missionTitleText}>🌱 {activeMission.title}</Text>
            <Text style={styles.missionDistText}>
              {targetAngularDist !== undefined
                ? targetAngularDist < 2
                  ? '🎯 TARGET LOCKED! Look up into the sky!'
                  : `${Math.round(targetAngularDist)}° to target — follow haptic pulses`
                : 'Searching sky...'}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelMission} style={styles.exitMissionBtn}>
            <Text style={styles.exitMissionText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* AI SCAN BANNER NOTIFICATION */}
      {aiResultText && (
        <TouchableOpacity
          style={styles.aiResultBanner}
          activeOpacity={0.9}
          onPress={() => {
            HapticsService.triggerClick();
            setChatModalVisible(true);
          }}
        >
          <View style={styles.aiResultHeaderRow}>
            <Text style={styles.aiResultTitle}>🤖 Open-Weight Edge Astrometry Match</Text>
            <Text style={styles.aiResultTapHint}>Tap to chat 💬</Text>
          </View>
          <Text style={styles.aiResultBody} numberOfLines={3}>
            {aiResultText}
          </Text>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              setAiResultText(null);
            }}
            style={styles.aiClose}
          >
            <Text style={styles.aiCloseText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* BOTTOM ACTION BAR - Hidden when star description card is open */}
      {!selectedObject && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.hudBtn}
            onPress={() => onToggleDebug(!debugMode)}
          >
            <Text style={styles.hudBtnText}>🛰️ HUD</Text>
          </TouchableOpacity>

          {/* Local AI Scanning Button */}
          <TouchableOpacity
            style={styles.aiScanBtn}
            activeOpacity={0.8}
            onPress={handleTriggerAiScan}
            disabled={isAiScanning}
          >
            {isAiScanning ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.aiScanText}>✨ Edge AI Identify</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hudBtn}
            onPress={() => {
              HapticsService.triggerClick();
              setChatModalVisible(true);
            }}
          >
            <Text style={styles.hudBtnText}>💬 Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.hudBtn} onPress={onOpenMissions}>
            <Text style={styles.hudBtnText}>🌱 Missions</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.hudBtn} onPress={onOpenSettings}>
            <Text style={styles.hudBtnText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* OBJECT INFO BOTTOM SHEET */}
      <ObjectInfoSheet
        object={selectedObject}
        onClose={() => setSelectedObject(null)}
        onOpenChat={(obj) => {
          setSelectedObject(obj);
          setChatModalVisible(true);
        }}
        onStartMission={(obj) => {
          setSelectedObject(null);
          onOpenMissions();
        }}
      />

      {/* STAR AI CHATBOT MODAL */}
      <StarChatModal
        visible={chatModalVisible}
        onClose={() => setChatModalVisible(false)}
        targetObject={selectedObject}
        location={location}
      />

      {/* DEVELOPER DEBUG HUD */}
      <DebugOverlay
        visible={debugMode}
        onClose={() => onToggleDebug(false)}
        orientation={orientation}
        location={location}
        visibleCount={visibleStars.length}
        isSimulatedTime={!!simulatedDate}
        onToggleSimulatedTime={() => {
          if (simulatedDate) {
            setSimulatedDate(null);
          } else {
            // Set fixed midnight for ideal stargazing demonstration
            const midnight = new Date();
            midnight.setHours(23, 0, 0, 0);
            setSimulatedDate(midnight);
          }
        }}
        onSetManualOrientation={(alt, az) => {
          setManualOrientation({ altitude: alt, azimuth: az, roll: 0, pitch: alt });
        }}
        onResetManual={() => {
          setManualOrientation(null);
          setSimulatedDate(null);
        }}
      />

      {/* COMPASS CALIBRATION MODAL */}
      <CalibrationModal
        visible={calibrationVisible}
        onClose={() => setCalibrationVisible(false)}
        confidence={orientation.headingConfidence}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050714',
  },
  cameraFallback: {
    backgroundColor: '#080E21',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  fallbackIcon: {
    fontSize: 50,
    marginBottom: 12,
  },
  fallbackTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  fallbackSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  permBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  permBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  daytimeBanner: {
    position: 'absolute',
    top: 98,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(217, 119, 6, 0.88)',
    borderRadius: 10,
    padding: 8,
    zIndex: 10,
  },
  daytimeText: {
    color: '#FFFBEB',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  topInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '300',
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  locationSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeMissionBar: {
    position: 'absolute',
    top: 96,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(6, 78, 59, 0.94)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#34D399',
    zIndex: 15,
  },
  missionTextCol: {
    flex: 1,
  },
  missionTitleText: {
    color: '#A7F3D0',
    fontWeight: '800',
    fontSize: 13,
  },
  missionDistText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  exitMissionBtn: {
    padding: 6,
    marginLeft: 8,
  },
  exitMissionText: {
    color: '#A7F3D0',
    fontWeight: 'bold',
    fontSize: 14,
  },
  aiResultBanner: {
    position: 'absolute',
    top: 156,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
    zIndex: 20,
  },
  aiResultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 24,
    marginBottom: 4,
  },
  aiResultTapHint: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  aiResultTitle: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  aiResultBody: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 16,
  },
  aiClose: {
    position: 'absolute',
    top: 8,
    right: 10,
    padding: 4,
  },
  aiCloseText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 24,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    zIndex: 10,
  },
  hudBtn: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 9,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 42,
  },
  hudBtnText: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 11,
  },
  aiScanBtn: {
    flex: 1.2,
    backgroundColor: '#0284C7',
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38BDF8',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  aiScanText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
