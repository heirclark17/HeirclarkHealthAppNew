/* global jest */

// ============================================
// AsyncStorage Mock (in-memory store)
// ============================================
const asyncStorageStore = {};
const mockAsyncStorage = {
  getItem: jest.fn((key) => Promise.resolve(asyncStorageStore[key] || null)),
  setItem: jest.fn((key, value) => {
    asyncStorageStore[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key) => {
    delete asyncStorageStore[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    Object.keys(asyncStorageStore).forEach((k) => delete asyncStorageStore[k]);
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() => Promise.resolve(Object.keys(asyncStorageStore))),
  multiGet: jest.fn((keys) =>
    Promise.resolve(keys.map((k) => [k, asyncStorageStore[k] || null]))
  ),
  multiSet: jest.fn((pairs) => {
    pairs.forEach(([k, v]) => {
      asyncStorageStore[k] = v;
    });
    return Promise.resolve();
  }),
  multiRemove: jest.fn((keys) => {
    keys.forEach((k) => delete asyncStorageStore[k]);
    return Promise.resolve();
  }),
  __resetStore: () => {
    Object.keys(asyncStorageStore).forEach((k) => delete asyncStorageStore[k]);
    mockAsyncStorage.getItem.mockClear();
    mockAsyncStorage.setItem.mockClear();
    mockAsyncStorage.removeItem.mockClear();
    mockAsyncStorage.clear.mockClear();
  },
};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: mockAsyncStorage,
}));

// ============================================
// Expo Secure Store
// ============================================
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// ============================================
// Expo Haptics
// ============================================
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy', Soft: 'soft', Rigid: 'rigid' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// ============================================
// Expo Apple Authentication
// ============================================
jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn(),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));

// ============================================
// React Native Health
// ============================================
jest.mock('react-native-health', () => ({
  default: {
    initHealthKit: jest.fn((_, cb) => cb(null)),
    getStepCount: jest.fn(),
    getActiveEnergyBurned: jest.fn(),
    getBasalEnergyBurned: jest.fn(),
    getHeartRateSamples: jest.fn(),
  },
  HealthKitPermissions: {},
}));

// ============================================
// React Native Reanimated
// ============================================
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// ============================================
// Expo Blur
// ============================================
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

// ============================================
// Expo Notifications
// ============================================
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'mock-push-token' })),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  AndroidImportance: { MAX: 5 },
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
}));

// ============================================
// Expo Router
// ============================================
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  usePathname: jest.fn(() => '/'),
  useSegments: jest.fn(() => []),
  Link: 'Link',
  Stack: { Screen: 'Screen' },
  Tabs: { Screen: 'Screen' },
  Redirect: 'Redirect',
}));

// ============================================
// Expo Font
// ============================================
jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true, null]),
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
}));

// ============================================
// Expo Constants
// ============================================
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: { extra: {} },
    manifest: null,
  },
}));

// ============================================
// Expo Image
// ============================================
jest.mock('expo-image', () => ({
  Image: 'ExpoImage',
}));

// ============================================
// Expo Image Picker
// ============================================
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({ canceled: true, assets: [] })
  ),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({ canceled: true, assets: [] })
  ),
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  MediaTypeOptions: { All: 'All', Images: 'Images', Videos: 'Videos' },
}));

// ============================================
// Expo Camera
// ============================================
jest.mock('expo-camera', () => ({
  Camera: 'Camera',
  CameraType: { back: 'back', front: 'front' },
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
}));

// ============================================
// Expo File System
// ============================================
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  cacheDirectory: '/mock/cache/',
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: false })),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  downloadAsync: jest.fn(() => Promise.resolve({ uri: '/mock/download' })),
}));

// ============================================
// Expo Location
// ============================================
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: 29.76, longitude: -95.37 } })
  ),
  Accuracy: { Balanced: 3 },
}));

// ============================================
// Expo Linear Gradient
// ============================================
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// ============================================
// Expo AV
// ============================================
jest.mock('expo-av', () => ({
  Audio: {
    Sound: { createAsync: jest.fn(() => Promise.resolve({ sound: { playAsync: jest.fn(), unloadAsync: jest.fn() } })) },
    setAudioModeAsync: jest.fn(),
  },
  Video: 'Video',
}));

// ============================================
// Expo Speech
// ============================================
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn(() => Promise.resolve(false)),
}));

// ============================================
// React Native SVG
// ============================================
jest.mock('react-native-svg', () => {
  const React = require('react');
  const mockComponent = (name) => {
    const Mock = (props) => React.createElement(name, props, props.children);
    Mock.displayName = name;
    return Mock;
  };
  return {
    __esModule: true,
    default: mockComponent('Svg'),
    Svg: mockComponent('Svg'),
    Circle: mockComponent('Circle'),
    Rect: mockComponent('Rect'),
    Path: mockComponent('Path'),
    G: mockComponent('G'),
    Text: mockComponent('SvgText'),
    TSpan: mockComponent('TSpan'),
    Defs: mockComponent('Defs'),
    LinearGradient: mockComponent('SvgLinearGradient'),
    Stop: mockComponent('Stop'),
    ClipPath: mockComponent('ClipPath'),
    Line: mockComponent('Line'),
    Polygon: mockComponent('Polygon'),
    Polyline: mockComponent('Polyline'),
    Ellipse: mockComponent('Ellipse'),
    Mask: mockComponent('Mask'),
  };
});

// ============================================
// Lucide React Native
// ============================================
jest.mock('lucide-react-native', () => {
  return new Proxy(
    {},
    {
      get: (_, name) => {
        if (name === '__esModule') return true;
        return name;
      },
    }
  );
});

// ============================================
// @expo/vector-icons
// ============================================
jest.mock('@expo/vector-icons', () => {
  const mockIcon = 'Icon';
  return {
    Ionicons: mockIcon,
    MaterialIcons: mockIcon,
    FontAwesome: mockIcon,
    FontAwesome5: mockIcon,
    Feather: mockIcon,
    MaterialCommunityIcons: mockIcon,
    AntDesign: mockIcon,
    Entypo: mockIcon,
    SimpleLineIcons: mockIcon,
  };
});

// ============================================
// @gorhom/bottom-sheet
// ============================================
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) =>
      React.createElement('BottomSheet', { ...props, ref }, props.children)
    ),
    BottomSheetModal: React.forwardRef((props, ref) =>
      React.createElement('BottomSheetModal', { ...props, ref }, props.children)
    ),
    BottomSheetModalProvider: (props) => props.children,
    BottomSheetBackdrop: 'BottomSheetBackdrop',
    BottomSheetScrollView: (props) =>
      React.createElement('BottomSheetScrollView', props, props.children),
    BottomSheetFlatList: (props) =>
      React.createElement('BottomSheetFlatList', props, props.children),
    BottomSheetTextInput: 'BottomSheetTextInput',
    BottomSheetView: (props) =>
      React.createElement('BottomSheetView', props, props.children),
    useBottomSheetModal: () => ({ dismiss: jest.fn(), dismissAll: jest.fn() }),
  };
});

// ============================================
// @callstack/liquid-glass
// ============================================
jest.mock('@callstack/liquid-glass', () => ({
  LiquidGlassView: 'LiquidGlassView',
}));

// ============================================
// expo-glass-effect
// ============================================
jest.mock('expo-glass-effect', () => ({
  GlassView: 'GlassView',
}));

// ============================================
// react-native-gesture-handler
// ============================================
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  return {
    Swipeable: 'Swipeable',
    GestureHandlerRootView: (props) => React.createElement('GestureHandlerRootView', props, props.children),
    PanGestureHandler: 'PanGestureHandler',
    TapGestureHandler: 'TapGestureHandler',
    FlingGestureHandler: 'FlingGestureHandler',
    State: {},
    Directions: {},
    gestureHandlerRootHOC: (component) => component,
  };
});

// ============================================
// moti
// ============================================
jest.mock('moti', () => {
  const React = require('react');
  return {
    MotiView: (props) => React.createElement('MotiView', props, props.children),
    MotiText: (props) => React.createElement('MotiText', props, props.children),
    AnimatePresence: (props) => props.children,
    useAnimationState: jest.fn(() => ({ current: 'from' })),
  };
});

// ============================================
// expo-background-fetch
// ============================================
jest.mock('expo-background-fetch', () => ({
  registerTaskAsync: jest.fn(() => Promise.resolve()),
  unregisterTaskAsync: jest.fn(() => Promise.resolve()),
  getStatusAsync: jest.fn(() => Promise.resolve(3)),
  BackgroundFetchResult: { NewData: 1, NoData: 2, Failed: 3 },
  BackgroundFetchStatus: { Restricted: 1, Denied: 2, Available: 3 },
}));

// ============================================
// expo-task-manager
// ============================================
jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn(() => Promise.resolve(false)),
  unregisterTaskAsync: jest.fn(() => Promise.resolve()),
}));

// ============================================
// expo-device
// ============================================
jest.mock('expo-device', () => ({
  isDevice: true,
  brand: 'Apple',
  modelName: 'iPhone 15 Pro',
  osName: 'iOS',
  osVersion: '18.0',
}));

// ============================================
// react-native-draggable-flatlist
// ============================================
jest.mock('react-native-draggable-flatlist', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props) => React.createElement('DraggableFlatList', props, null),
    ScaleDecorator: (props) => props.children,
    ShadowDecorator: (props) => props.children,
    OpacityDecorator: (props) => props.children,
  };
});

// ============================================
// @quidone/react-native-wheel-picker
// ============================================
jest.mock('@quidone/react-native-wheel-picker', () => ({
  WheelPicker: 'WheelPicker',
}));

// ============================================
// @react-native-community/datetimepicker
// ============================================
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

// ============================================
// react-native-webview
// ============================================
jest.mock('react-native-webview', () => ({
  __esModule: true,
  default: 'WebView',
  WebView: 'WebView',
}));

// ============================================
// expo-linking
// ============================================
jest.mock('expo-linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  createURL: jest.fn((path) => `exp://mock/${path}`),
}));

// ============================================
// expo-status-bar
// ============================================
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// ============================================
// Global fetch mock
// ============================================
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true }),
    text: () => Promise.resolve(''),
  })
);

// ============================================
// Silence console noise in tests
// ============================================
const originalConsole = { ...console };
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  // Keep info for test debugging
  info: originalConsole.info,
};

// ============================================
// Alert mock
// ============================================
jest.spyOn(require('react-native').Alert, 'alert');
