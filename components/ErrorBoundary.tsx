import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../constants/Theme';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 *
 * This prevents the black screen issue by showing what went wrong.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('═══════════════════════════════════════════════');
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    console.error('═══════════════════════════════════════════════');

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="alert-circle" size={64} color={Colors.error} />

            <Text style={styles.title}>Oops! Something went wrong</Text>

            <Text style={styles.subtitle}>
              The app encountered an error and couldn't continue.
            </Text>

            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Error:</Text>
              <Text style={styles.errorMessage}>{this.state.error.message}</Text>

              {__DEV__ && this.state.errorInfo && (
                <ScrollView style={styles.stackScroll}>
                  <Text style={styles.stackLabel}>Stack Trace:</Text>
                  <Text style={styles.stackText}>
                    {this.state.error.stack}
                  </Text>
                  <Text style={styles.stackLabel}>Component Stack:</Text>
                  <Text style={styles.stackText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                </ScrollView>
              )}
            </View>

            <TouchableOpacity
              onPress={this.handleReload}
              style={styles.reloadButton}
            >
              <Ionicons name="refresh" size={20} color="#fff" style={styles.reloadIcon} />
              <Text style={styles.reloadButtonText}>Try Again</Text>
            </TouchableOpacity>

            {__DEV__ && (
              <Text style={styles.devNote}>
                💡 Tip: Check the Metro bundler terminal for more details
              </Text>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 500,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorBox: {
    padding: 16,
    width: '100%',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  errorTitle: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.error,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#fff',
    lineHeight: 20,
  },
  stackScroll: {
    maxHeight: 200,
    marginTop: 12,
  },
  stackLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    marginTop: 8,
    marginBottom: 4,
  },
  stackText: {
    fontSize: 11,
    fontFamily: 'Courier',
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minWidth: 200,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  reloadIcon: {
    marginRight: 8,
  },
  reloadButtonText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: '#fff',
  },
  devNote: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
