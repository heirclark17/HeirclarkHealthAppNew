import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing } from '../constants/Theme';
import { Camera, CameraType, BarCodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

interface MealData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving?: string;
  mealTime: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
}

type LoggingMethod = 'manual' | 'barcode' | 'ai-photo' | 'ai-text';

export function MealLoggingModal({
  visible,
  onClose,
  onMealLogged,
  selectedDate,
}: {
  visible: boolean;
  onClose: () => void;
  onMealLogged: (meal: MealData) => void;
  selectedDate: string;
}) {
  const [activeMethod, setActiveMethod] = useState<LoggingMethod>('manual');

  // Manual input state
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [serving, setServing] = useState('');
  const [mealTime, setMealTime] = useState<MealData['mealTime']>('Lunch');

  // Barcode state
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [barcodeLoading, setBarcodeLoading] = useState(false);

  // AI Photo state
  const [hasCameraPerm, setHasCameraPerm] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [aiPhotoLoading, setAiPhotoLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef<Camera>(null);

  // AI Text state
  const [aiTextInput, setAiTextInput] = useState('');
  const [aiTextLoading, setAiTextLoading] = useState(false);

  const mealTimes: MealData['mealTime'][] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  useEffect(() => {
    if (visible) {
      detectMealTimeFromDate();
      requestPermissions();
    }
  }, [visible]);

  const detectMealTimeFromDate = () => {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 5 && hour < 11) {
      setMealTime('Breakfast');
    } else if (hour >= 11 && hour < 16) {
      setMealTime('Lunch');
    } else if (hour >= 16 && hour < 21) {
      setMealTime('Dinner');
    } else {
      setMealTime('Snacks');
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    setHasCameraPerm(cameraStatus === 'granted');
  };

  const resetForm = () => {
    setMealName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setServing('');
    setScannedBarcode('');
    setSelectedPhoto(null);
    setAiTextInput('');
  };

  const handleManualSubmit = () => {
    if (!mealName.trim() || !calories) {
      Alert.alert('Error', 'Please enter meal name and calories');
      return;
    }

    const mealData: MealData = {
      name: mealName.trim(),
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      serving: serving.trim() || undefined,
      mealTime,
    };

    onMealLogged(mealData);
    resetForm();
    onClose();
  };

  const handleBarcodeScanned = async ({ data }: BarCodeScanningResult) => {
    if (scannedBarcode === data || barcodeLoading) return;

    setScannedBarcode(data);
    setBarcodeLoading(true);

    try {
      // Call nutrition API (OpenFoodFacts, USDA, or custom backend)
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);
      const result = await response.json();

      if (result.status === 1 && result.product) {
        const product = result.product;
        const nutrients = product.nutriments || {};

        setMealName(product.product_name || 'Unknown Product');
        setCalories(String(nutrients.energy_kcal_100g || 0));
        setProtein(String(nutrients.proteins_100g || 0));
        setCarbs(String(nutrients.carbohydrates_100g || 0));
        setFat(String(nutrients.fat_100g || 0));
        setServing('100g');

        Alert.alert('Success', 'Product found! Review and log meal.');
        setActiveMethod('manual');
      } else {
        Alert.alert('Not Found', 'Product not found in database. Enter manually.');
        setActiveMethod('manual');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch product data');
      console.error(error);
    } finally {
      setBarcodeLoading(false);
      setScannedBarcode('');
    }
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      setSelectedPhoto(photo.uri);
      setShowCamera(false);
      await analyzePhoto(photo.base64!);
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
      console.error(error);
    }
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedPhoto(result.assets[0].uri);
      await analyzePhoto(result.assets[0].base64!);
    }
  };

  const analyzePhoto = async (base64Image: string) => {
    setAiPhotoLoading(true);

    try {
      // Call your AI backend (GPT-4 Vision, Claude with vision, or custom model)
      // This is a placeholder - you'll need to implement your actual API endpoint
      const response = await fetch('YOUR_AI_VISION_API_ENDPOINT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          prompt: 'Analyze this food image and provide: meal name, estimated calories, protein (g), carbs (g), fat (g), and serving size.',
        }),
      });

      const result = await response.json();

      // Parse AI response and populate fields
      // This structure depends on your AI API response format
      if (result.mealData) {
        setMealName(result.mealData.name || '');
        setCalories(String(result.mealData.calories || 0));
        setProtein(String(result.mealData.protein || 0));
        setCarbs(String(result.mealData.carbs || 0));
        setFat(String(result.mealData.fat || 0));
        setServing(result.mealData.serving || '');

        Alert.alert('Success', 'AI analyzed your photo! Review and log meal.');
        setActiveMethod('manual');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze photo. Enter manually.');
      console.error(error);
      setActiveMethod('manual');
    } finally {
      setAiPhotoLoading(false);
    }
  };

  const handleAITextAnalysis = async () => {
    if (!aiTextInput.trim()) {
      Alert.alert('Error', 'Please enter a meal description');
      return;
    }

    setAiTextLoading(true);

    try {
      // Call your AI text analysis endpoint
      const response = await fetch('YOUR_AI_TEXT_API_ENDPOINT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: aiTextInput,
          prompt: 'Parse this meal description and provide: meal name, estimated calories, protein (g), carbs (g), fat (g), and serving size.',
        }),
      });

      const result = await response.json();

      if (result.mealData) {
        setMealName(result.mealData.name || '');
        setCalories(String(result.mealData.calories || 0));
        setProtein(String(result.mealData.protein || 0));
        setCarbs(String(result.mealData.carbs || 0));
        setFat(String(result.mealData.fat || 0));
        setServing(result.mealData.serving || '');

        Alert.alert('Success', 'AI parsed your description! Review and log meal.');
        setActiveMethod('manual');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze text. Enter manually.');
      console.error(error);
    } finally {
      setAiTextLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.background, Colors.card, Colors.background]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>LOG MEAL</Text>
            <Text style={styles.headerSubtitle}>{new Date(selectedDate).toLocaleDateString()}</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Method Selector */}
        <View style={styles.methodSelector}>
          <TouchableOpacity
            style={[styles.methodButton, activeMethod === 'manual' && styles.methodButtonActive]}
            onPress={() => setActiveMethod('manual')}
          >
            <Text style={[styles.methodButtonText, activeMethod === 'manual' && styles.methodButtonTextActive]}>
              ✍️ Manual
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodButton, activeMethod === 'barcode' && styles.methodButtonActive]}
            onPress={() => setActiveMethod('barcode')}
          >
            <Text style={[styles.methodButtonText, activeMethod === 'barcode' && styles.methodButtonTextActive]}>
              📷 Barcode
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodButton, activeMethod === 'ai-photo' && styles.methodButtonActive]}
            onPress={() => setActiveMethod('ai-photo')}
          >
            <Text style={[styles.methodButtonText, activeMethod === 'ai-photo' && styles.methodButtonTextActive]}>
              🤖 AI Photo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodButton, activeMethod === 'ai-text' && styles.methodButtonActive]}
            onPress={() => setActiveMethod('ai-text')}
          >
            <Text style={[styles.methodButtonText, activeMethod === 'ai-text' && styles.methodButtonTextActive]}>
              💬 AI Text
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Manual Input */}
          {activeMethod === 'manual' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>MANUAL ENTRY</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Meal Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Grilled Chicken Salad"
                  placeholderTextColor={Colors.textMuted}
                  value={mealName}
                  onChangeText={setMealName}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Calories</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    value={calories}
                    onChangeText={setCalories}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Serving</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1 cup"
                    placeholderTextColor={Colors.textMuted}
                    value={serving}
                    onChangeText={setServing}
                  />
                </View>
              </View>

              <Text style={styles.subsectionTitle}>Macronutrients (grams)</Text>

              <View style={styles.macroRow}>
                <View style={styles.macroInput}>
                  <Text style={styles.inputLabel}>Protein</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    value={protein}
                    onChangeText={setProtein}
                  />
                </View>

                <View style={styles.macroInput}>
                  <Text style={styles.inputLabel}>Carbs</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    value={carbs}
                    onChangeText={setCarbs}
                  />
                </View>

                <View style={styles.macroInput}>
                  <Text style={styles.inputLabel}>Fat</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    value={fat}
                    onChangeText={setFat}
                  />
                </View>
              </View>

              <Text style={styles.subsectionTitle}>Meal Time</Text>
              <View style={styles.mealTimeRow}>
                {mealTimes.map(time => (
                  <TouchableOpacity
                    key={time}
                    style={[styles.mealTimeButton, mealTime === time && styles.mealTimeButtonActive]}
                    onPress={() => setMealTime(time)}
                  >
                    <Text
                      style={[
                        styles.mealTimeButtonText,
                        mealTime === time && styles.mealTimeButtonTextActive,
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleManualSubmit}>
                <Text style={styles.submitButtonText}>Log Meal</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Barcode Scanner */}
          {activeMethod === 'barcode' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>BARCODE SCANNER</Text>

              {!hasCameraPerm ? (
                <View style={styles.permissionPrompt}>
                  <Text style={styles.permissionText}>Camera permission is required</Text>
                  <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={requestPermissions}
                  >
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.scannerContainer}>
                  <Camera
                    style={StyleSheet.absoluteFillObject}
                    barCodeScannerSettings={{
                      barCodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
                    }}
                    onBarCodeScanned={scannedBarcode ? undefined : handleBarcodeScanned}
                  />
                  <View style={styles.scannerOverlay}>
                    <View style={styles.scannerFrame} />
                    <Text style={styles.scannerInstructions}>
                      {barcodeLoading ? 'Looking up product...' : 'Align barcode within frame'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* AI Photo Analysis */}
          {activeMethod === 'ai-photo' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AI PHOTO ANALYSIS</Text>

              {selectedPhoto ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: selectedPhoto }} style={styles.photoImage} />
                  {aiPhotoLoading && (
                    <View style={styles.photoLoadingOverlay}>
                      <Text style={styles.photoLoadingText}>Analyzing...</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => setSelectedPhoto(null)}
                  >
                    <Text style={styles.removePhotoButtonText}>✕ Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoActions}>
                  <TouchableOpacity
                    style={styles.photoActionButton}
                    onPress={() => setShowCamera(true)}
                  >
                    <Text style={styles.photoActionIcon}>📸</Text>
                    <Text style={styles.photoActionText}>Take Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.photoActionButton} onPress={handlePickPhoto}>
                    <Text style={styles.photoActionIcon}>🖼️</Text>
                    <Text style={styles.photoActionText}>Choose from Library</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.helperText}>
                AI will analyze your food photo and estimate nutritional content
              </Text>
            </View>
          )}

          {/* AI Text Analysis */}
          {activeMethod === 'ai-text' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AI TEXT ANALYSIS</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Describe Your Meal</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g., 8oz grilled chicken breast with 1 cup brown rice and steamed broccoli"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={4}
                  value={aiTextInput}
                  onChangeText={setAiTextInput}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, aiTextLoading && styles.submitButtonDisabled]}
                onPress={handleAITextAnalysis}
                disabled={aiTextLoading}
              >
                <Text style={styles.submitButtonText}>
                  {aiTextLoading ? 'Analyzing...' : 'Analyze with AI'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.helperText}>
                Describe your meal naturally. AI will parse and estimate nutrition.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Camera Modal */}
        <Modal
          visible={showCamera}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowCamera(false)}
        >
          <View style={styles.cameraContainer}>
            {hasCameraPerm ? (
              <>
                <Camera
                  ref={cameraRef}
                  style={StyleSheet.absoluteFillObject}
                  type={CameraType.back}
                  onCameraReady={() => setCameraReady(true)}
                />
                <View style={styles.cameraControls}>
                  <TouchableOpacity
                    style={styles.cameraCancelButton}
                    onPress={() => setShowCamera(false)}
                  >
                    <Text style={styles.cameraCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cameraShutterButton, !cameraReady && styles.cameraShutterButtonDisabled]}
                    onPress={handleTakePhoto}
                    disabled={!cameraReady}
                  >
                    <View style={styles.cameraShutterInner} />
                  </TouchableOpacity>

                  <View style={{ width: 80 }} />
                </View>
              </>
            ) : (
              <View style={styles.permissionPrompt}>
                <Text style={styles.permissionText}>Camera permission is required</Text>
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={requestPermissions}
                >
                  <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    color: Colors.text,
    letterSpacing: 2,
    fontFamily: Fonts.bold,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    fontFamily: Fonts.regular,
  },
  closeButton: {
    fontSize: 28,
    color: Colors.text,
    fontFamily: Fonts.regular,
  },
  methodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  methodButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 10,
    borderRadius: Spacing.borderRadius,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  methodButtonActive: {
    backgroundColor: Colors.primary + '30',
    borderColor: Colors.primary,
  },
  methodButtonText: {
    fontSize: 11,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  methodButtonTextActive: {
    fontFamily: Fonts.semiBold,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 16,
    fontFamily: Fonts.semiBold,
  },
  subsectionTitle: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: Fonts.medium,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontFamily: Fonts.medium,
  },
  input: {
    backgroundColor: 'transparent',
    borderRadius: Spacing.borderRadius,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: Fonts.regular,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  macroInput: {
    flex: 1,
  },
  mealTimeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  mealTimeButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealTimeButtonActive: {
    backgroundColor: Colors.primary + '30',
    borderColor: Colors.primary,
  },
  mealTimeButtonText: {
    fontSize: 12,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  mealTimeButtonTextActive: {
    fontFamily: Fonts.semiBold,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Spacing.borderRadius,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: Colors.primaryText,
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 12,
    textAlign: 'center',
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
  },
  scannerContainer: {
    height: 400,
    borderRadius: Spacing.borderRadius,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 8,
  },
  scannerInstructions: {
    marginTop: 20,
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.medium,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoActionButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: Spacing.borderRadius,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  photoActionText: {
    fontSize: 12,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  photoPreview: {
    marginBottom: 16,
  },
  photoImage: {
    width: '100%',
    height: 300,
    borderRadius: Spacing.borderRadius,
  },
  photoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.borderRadius,
  },
  photoLoadingText: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  removePhotoButton: {
    marginTop: 12,
    backgroundColor: 'transparent',
    paddingVertical: 10,
    borderRadius: Spacing.borderRadius,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  removePhotoButtonText: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  permissionPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: Fonts.regular,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Spacing.borderRadius,
  },
  permissionButtonText: {
    color: Colors.primaryText,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  cameraCancelButton: {
    width: 80,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: Spacing.borderRadius,
    alignItems: 'center',
  },
  cameraCancelButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  cameraShutterButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.text,
  },
  cameraShutterButtonDisabled: {
    opacity: 0.3,
  },
  cameraShutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.text,
  },
});
