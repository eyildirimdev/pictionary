import React, { useEffect, useRef, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  PanResponder, 
  Animated, 
  Dimensions,
  StatusBar,
  Alert
} from 'react-native';
import { io } from 'socket.io-client';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const socket = io(process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://localhost:4000');

export default function App() {
  const [roomId] = useState('lobby');
  const [paths, setPaths] = useState<string[]>([]);
  const [word, setWord] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [canvasLayout, setCanvasLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Animation values
  const titleScale = useRef(new Animated.Value(1)).current;
  const canvasScale = useRef(new Animated.Value(1)).current;
  const clearButtonScale = useRef(new Animated.Value(1)).current;
  const backgroundAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const canvasRef = useRef<View>(null);

  // Function to measure canvas position
  const measureCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.measure((x, y, width, height, pageX, pageY) => {
        setCanvasLayout({ x: pageX, y: pageY, width, height });
      });
    }
  };

  // Create pulsing animation for the word display
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
  }, []);

  // Background gradient animation
  useEffect(() => {
    const backgroundAnim = Animated.loop(
      Animated.timing(backgroundAnimation, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: false,
      })
    );
    backgroundAnim.start();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Scale animation when drawing starts
        Animated.spring(canvasScale, {
          toValue: 1.02,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_e, gesture) => {
        // Use measured canvas position
        const canvasX0 = gesture.x0 - canvasLayout.x;
        const canvasY0 = gesture.y0 - canvasLayout.y;
        const canvasX1 = gesture.moveX - canvasLayout.x;
        const canvasY1 = gesture.moveY - canvasLayout.y;
        
        // Clamp coordinates to canvas bounds
        const clampedX0 = Math.max(0, Math.min(canvasLayout.width, canvasX0));
        const clampedY0 = Math.max(0, Math.min(canvasLayout.height, canvasY0));
        const clampedX1 = Math.max(0, Math.min(canvasLayout.width, canvasX1));
        const clampedY1 = Math.max(0, Math.min(canvasLayout.height, canvasY1));
        
        const d = `M${clampedX0} ${clampedY0} L${clampedX1} ${clampedY1}`;
        socket.emit('stroke', { roomId, x0: clampedX0, y0: clampedY0, x1: clampedX1, y1: clampedY1 });
        setPaths((p) => [...p, d]);
      },
      onPanResponderRelease: () => {
        // Reset scale when drawing ends
        Animated.spring(canvasScale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      }
    })
  ).current;

  const handleTitlePress = () => {
    Animated.sequence([
      Animated.timing(titleScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(titleScale, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleClearPress = () => {
    Animated.sequence([
      Animated.timing(clearButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(clearButtonScale, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
    
    setPaths([]);
    socket.emit('clear', { roomId });
  };

  const handleGuessSubmit = () => {
    if (inputValue.trim()) {
      socket.emit('guess', { roomId, text: inputValue.trim() });
      setInputValue('');
    }
  };

  useEffect(() => {
    socket.emit('joinRoom', { roomId });
    socket.on('stroke', ({ x0, y0, x1, y1 }) => {
      // Scale coordinates to match mobile canvas dimensions
      const webCanvasWidth = 672; // max-w-2xl approximate width
      const webCanvasHeight = 384; // h-96 height
      const mobileCanvasWidth = width - 40;
      const mobileCanvasHeight = height * 0.4;
      
      const scaleX = mobileCanvasWidth / webCanvasWidth;
      const scaleY = mobileCanvasHeight / webCanvasHeight;
      
      const scaledX0 = x0 * scaleX;
      const scaledY0 = y0 * scaleY;
      const scaledX1 = x1 * scaleX;
      const scaledY1 = y1 * scaleY;
      
      const d = `M${scaledX0} ${scaledY0} L${scaledX1} ${scaledY1}`;
      setPaths((p) => [...p, d]);
    });
    socket.on('clear', () => setPaths([]));
    socket.on('word', setWord);
    socket.on('correctGuess', (t: string) => {
      Alert.alert('🎉 Correct!', `"${t}"`, [{ text: 'Awesome!', style: 'default' }]);
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Animated Background */}
      <Animated.View style={[styles.backgroundGradient, {
        opacity: backgroundAnimation.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.8, 1, 0.8],
        })
      }]} />
      
      {/* Floating Particles Effect */}
      <View style={styles.particlesContainer}>
        {[...Array(6)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                left: `${15 + i * 12}%`,
                animationDelay: `${i * 0.5}s`,
              }
            ]}
          />
        ))}
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Title */}
        <TouchableOpacity onPress={handleTitlePress} activeOpacity={0.8}>
          <Animated.View style={[styles.titleContainer, { transform: [{ scale: titleScale }] }]}>
            <Text style={styles.title}>🎨 Pictionary</Text>
            <Text style={styles.titleSubtext}>Draw & Guess</Text>
          </Animated.View>
        </TouchableOpacity>

        {/* Word Display */}
        <Animated.View 
          style={[
            styles.wordContainer, 
            { transform: [{ scale: pulseAnimation }] }
          ]}
        >
          <Text style={styles.wordLabel}>Your Word</Text>
          <Text style={styles.word}>{word || '🎯 Waiting...'}</Text>
        </Animated.View>

        {/* Drawing Canvas */}
        <Animated.View 
          ref={canvasRef}
          style={[
            styles.canvasContainer, 
            { transform: [{ scale: canvasScale }] }
          ]} 
          {...panResponder.panHandlers}
          onLayout={measureCanvas}
        >
          <View style={styles.canvasInner}>
            <Svg height="100%" width="100%">
              <Defs>
                <LinearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#667eea" />
                  <Stop offset="100%" stopColor="#764ba2" />
                </LinearGradient>
              </Defs>
              {paths.map((d, idx) => (
                <Path 
                  key={idx} 
                  d={d} 
                  stroke="url(#strokeGradient)" 
                  strokeWidth="3" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              ))}
            </Svg>
          </View>
          <View style={styles.canvasOverlay}>
            <Text style={styles.canvasHint}>✏️ Draw here</Text>
          </View>
        </Animated.View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="💭 Enter your guess..."
              placeholderTextColor="#a0a0a0"
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              onSubmitEditing={handleGuessSubmit}
              returnKeyType="send"
            />
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={handleGuessSubmit}
              activeOpacity={0.7}
            >
              <Text style={styles.sendButtonText}>🚀</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Clear Button */}
        <TouchableOpacity 
          onPress={handleClearPress}
          activeOpacity={0.8}
          style={styles.clearButtonContainer}
        >
          <Animated.View style={[styles.clearButton, { transform: [{ scale: clearButtonScale }] }]}>
            <Text style={styles.clearButtonText}>🗑️ Clear Canvas</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a2e',
    background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460)',
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#667eea',
    borderRadius: 2,
    opacity: 0.6,
    top: '20%',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(102, 126, 234, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  titleSubtext: {
    fontSize: 16,
    color: '#a0a0a0',
    fontWeight: '500',
    marginTop: 4,
  },
  wordContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    backdropFilter: 'blur(10px)',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  wordLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  word: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginTop: 4,
  },
  canvasContainer: {
    width: width - 40,
    height: height * 0.4,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  canvasInner: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.4)',
  },
  canvasOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  canvasHint: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  inputSection: {
    width: '100%',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  input: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  sendButton: {
    backgroundColor: 'rgba(102, 126, 234, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 18,
  },
  clearButtonContainer: {
    width: '100%',
  },
  clearButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(220, 53, 69, 0.5)',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  clearButtonText: {
    color: '#ff6b7a',
    fontSize: 16,
    fontWeight: '700',
  },
});