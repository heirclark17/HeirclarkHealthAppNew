import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NumberText } from './NumberText';
import { Fonts } from '../constants/Theme';

export function FontTest() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Urbanist Regular (letters):</Text>
      <Text style={[styles.test, { fontFamily: Fonts.regular }]}>
        The quick brown fox jumps
      </Text>

      <Text style={styles.label}>SF Pro Rounded Regular (direct):</Text>
      <Text style={[styles.test, { fontFamily: 'SFProRounded-Regular' }]}>
        1234567890
      </Text>

      <Text style={styles.label}>NumberText component (should be SF Pro):</Text>
      <NumberText weight="regular" style={styles.test}>
        1234567890
      </NumberText>

      <Text style={styles.label}>SF Pro Rounded Medium:</Text>
      <Text style={[styles.test, { fontFamily: 'SFProRounded-Medium' }]}>
        1234567890
      </Text>

      <Text style={styles.label}>NumberText medium:</Text>
      <NumberText weight="medium" style={styles.test}>
        1234567890
      </NumberText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'white',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 16,
    marginBottom: 4,
  },
  test: {
    fontSize: 24,
    color: '#000',
  },
});
