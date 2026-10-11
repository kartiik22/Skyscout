import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { SkyObject, DeviceOrientation, Constellation } from '../types/astronomy';
import { projectToScreen, matrixFromAltAz } from '../astronomy/projection';

interface SkyOverlayProps {
  objects: SkyObject[];
  constellations?: Constellation[];
  orientation: DeviceOrientation;
  selectedObjectId?: string | null;
  targetMissionObjectId?: string | null;
  onSelectObject: (obj: SkyObject) => void;
  verticalFov?: number;   // default ~63 degrees
}

export const SkyOverlay: React.FC<SkyOverlayProps> = ({
  objects,
  constellations = [],
  orientation,
  selectedObjectId,
  targetMissionObjectId,
  onSelectObject,
  verticalFov = 63,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const M = orientation.matrix ?? matrixFromAltAz(orientation.altitude, orientation.azimuth);

  const project = (az: number, alt: number) =>
    projectToScreen(alt, az, M, verticalFov, screenWidth, screenHeight);

  // for labels: clip to the screen with a margin
  const getScreenCoordinates = (az: number, alt: number) => {
    const p = project(az, alt);
    if (!p || Math.abs(p.nx) > 1.35 || Math.abs(p.ny) > 1.35) return null;
    return p;
  };

  // for constellation lines: NO clipping, only "in front of camera"
  const objectCoordsMap = new Map<string, { x: number; y: number }>();
  objects.forEach((obj) => {
    const p = project(obj.azimuth, obj.altitude);
    if (p) objectCoordsMap.set(obj.id, { x: p.x, y: p.y });
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* 1. Constellation Astrological Lines */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        {constellations.map((con) => {
          return con.lines.map(([s1, s2], idx) => {
            const p1 = objectCoordsMap.get(s1);
            const p2 = objectCoordsMap.get(s2);
            if (!p1 || !p2) return null;

            return (
              <Line
                key={`${con.id}-${idx}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="rgba(100, 200, 255, 0.35)"
                strokeWidth="1.5"
                strokeDasharray="4, 3"
              />
            );
          });
        })}
      </Svg>

      {/* 2. Interactive Celestial Objects & Star Labels */}
      {objects.map((obj) => {
        const coords = getScreenCoordinates(obj.azimuth, obj.altitude);
        if (!coords) return null;

        const isSelected = selectedObjectId === obj.id;
        const isMissionTarget = targetMissionObjectId === obj.id;

        // Dynamic star icon sizing based on astronomical magnitude
        // Brighter stars (lower magnitude) get slightly larger glow
        const isMoon = obj.id === 'moon';
        const starSize = isMoon ? 36 : Math.max(12, Math.min(26, 22 - obj.magnitude * 3));
        const starColor =
          isMoon
            ? '#FEF08A'
            : obj.type === 'planet'
            ? '#FFD166'
            : obj.name === 'Betelgeuse' || obj.name === 'Antares' || obj.name === 'Aldebaran'
            ? '#FF7A59'
            : obj.name === 'Sirius' || obj.name === 'Rigel' || obj.name === 'Vega'
            ? '#90E0EF'
            : '#FFFFFF';

        return (
          <TouchableOpacity
            key={obj.id}
            activeOpacity={0.7}
            onPress={() => onSelectObject(obj)}
            style={[
              styles.objectContainer,
              {
                left: coords.x - 45,
                top: coords.y - (isMoon ? 35 : 25),
              },
            ]}
          >
            {/* Pulsing ring for mission targets */}
            {isMissionTarget && <View style={styles.missionTargetRing} />}

            {/* Glowing Star or Moon Icon */}
            <View
              style={[
                styles.starDot,
                {
                  width: starSize,
                  height: starSize,
                  borderRadius: starSize / 2,
                  backgroundColor: starColor,
                  shadowColor: starColor,
                  shadowOpacity: 0.9,
                  shadowRadius: isMoon ? 16 : 10,
                  elevation: 10,
                },
              ]}
            >
              <Text style={[styles.starGlyph, isMoon && { fontSize: 18 }]}>
                {isMoon ? '🌙' : '★'}
              </Text>
            </View>

            {/* Star Label */}
            <View
              style={[
                styles.labelBubble,
                isSelected && styles.selectedBubble,
                isMissionTarget && styles.missionBubble,
              ]}
            >
              <Text style={[styles.labelText, isMissionTarget && styles.missionLabelText]}>
                {obj.name}
              </Text>
              {obj.constellationName && (
                <Text style={styles.subLabelText}>{obj.constellationName}</Text>
              )}
              {isSelected && (
                <Text style={styles.tapToAskText}>💬 Tap to Ask AI</Text>
              )}
            </View>

            {/* Delicate Connecting Line */}
            <View style={styles.connectingLine} />
          </TouchableOpacity>
        );
      })}

      {/* 3. Subtle Camera Reticle In Center */}
      <View style={styles.centerReticle} pointerEvents="none">
        <View style={styles.reticleCrosshairH} />
        <View style={styles.reticleCrosshairV} />
        <View style={styles.reticleCenterDot} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  objectContainer: {
    position: 'absolute',
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starDot: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  starGlyph: {
    fontSize: 10,
    color: '#050714',
    fontWeight: 'bold',
  },
  labelBubble: {
    backgroundColor: 'rgba(10, 15, 35, 0.75)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
  },
  selectedBubble: {
    borderColor: '#48CAE4',
    backgroundColor: 'rgba(0, 119, 182, 0.85)',
  },
  missionBubble: {
    borderColor: '#FFD166',
    backgroundColor: 'rgba(180, 83, 9, 0.85)',
  },
  labelText: {
    color: '#F8F9FA',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  missionLabelText: {
    color: '#FFFBEB',
  },
  subLabelText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '500',
  },
  tapToAskText: {
    color: '#BAE6FD',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  connectingLine: {
    width: 28,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: 2,
  },
  missionTargetRing: {
    position: 'absolute',
    top: -8,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFD166',
    borderStyle: 'dashed',
  },
  centerReticle: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleCrosshairH: {
    position: 'absolute',
    width: 24,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  reticleCrosshairV: {
    position: 'absolute',
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  reticleCenterDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#38BDF8',
  },
});
