import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { StargazingScreen } from './src/screens/StargazingScreen';
import { MissionScreen } from './src/screens/MissionScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { HowItWorksScreen } from './src/screens/HowItWorksScreen';
import { CalibrationModal } from './src/components/CalibrationModal';
import { SensorFusion } from './src/sensors/SensorFusion';
import { TouchGrassMission } from './src/types/astronomy';
import { AIChatService } from './src/ai/AIChatService';

// Initialize AIChatService with API key if defined in environment
if (typeof process !== 'undefined' && process.env?.APIKEY) {
  AIChatService.setApiKey(process.env.APIKEY);
}

type AppScreen = 'home' | 'stargazing';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [showMissions, setShowMissions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);

  // Global settings state
  const [debugMode, setDebugMode] = useState(false);
  const [minAltitude, setMinAltitude] = useState(0); // 0 degrees (entire visible hemisphere above horizon)
  const [activeMission, setActiveMission] = useState<TouchGrassMission | null>(null);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {currentScreen === 'home' ? (
        <HomeScreen
          onStartStargazing={() => setCurrentScreen('stargazing')}
          onOpenHowItWorks={() => setShowHowItWorks(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenMissions={() => setShowMissions(true)}
        />
      ) : (
        <StargazingScreen
          onBackToHome={() => setCurrentScreen('home')}
          onOpenSettings={() => setShowSettings(true)}
          onOpenMissions={() => setShowMissions(true)}
          debugMode={debugMode}
          onToggleDebug={setDebugMode}
          minAltitude={minAltitude}
          activeMission={activeMission}
          onCancelMission={() => setActiveMission(null)}
        />
      )}

      {/* Modal Sheets */}
      <Modal visible={showMissions} animationType="slide">
        <MissionScreen
          onClose={() => setShowMissions(false)}
          activeMissionId={activeMission?.id}
          onSelectMission={(mission) => {
            setActiveMission(mission);
            setShowMissions(false);
            if (currentScreen !== 'stargazing') {
              setCurrentScreen('stargazing');
            }
          }}
          onCancelMission={() => setActiveMission(null)}
        />
      </Modal>

      <Modal visible={showSettings} animationType="slide">
        <SettingsScreen
          onClose={() => setShowSettings(false)}
          debugMode={debugMode}
          onToggleDebug={setDebugMode}
          minAltitude={minAltitude}
          onChangeMinAltitude={setMinAltitude}
          onOpenCalibration={() => {
            SensorFusion.getInstance().startCalibration();
            setShowSettings(false);
            setShowCalibration(true);
          }}
        />
      </Modal>

      <Modal visible={showHowItWorks} animationType="slide">
        <HowItWorksScreen onClose={() => setShowHowItWorks(false)} />
      </Modal>

      <CalibrationModal
        visible={showCalibration}
        onClose={() => {
          SensorFusion.getInstance().finishCalibration();
          setShowCalibration(false);
        }}
        confidence="high"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050714',
  },
});
