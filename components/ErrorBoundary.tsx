/**
 * Error Boundary Component
 *
 * A React class component that catches JavaScript errors anywhere in its child
 * component tree and displays a fallback UI instead of crashing the app.
 */

import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Button } from '@/components/ui/button';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    this.props.onReset?.();
  };

  handleRetry = () => {
    this.handleReset();
    // Force a re-render of children by updating state
    this.forceUpdate();
  };

  toggleDetails = () => {
    this.setState(prev => ({
      showDetails: !prev.showDetails,
    }));
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          showDetails={this.state.showDetails}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
          onToggleDetails={this.toggleDetails}
        />
      );
    }

    return this.props.children;
  }
}

// Separate component for the fallback UI to use hooks
interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  onRetry: () => void;
  onReset: () => void;
  onToggleDetails: () => void;
}

function ErrorFallback({
  error,
  errorInfo,
  showDetails,
  onRetry,
  onReset,
  onToggleDetails,
}: ErrorFallbackProps) {
  const { colors, isDark } = useTheme();
  const { uiFont } = useFonts();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Error Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.surfaceError }]}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={colors.textOnError} />
        </View>

        {/* Error Title */}
        <Text style={[styles.title, { color: colors.text, fontFamily: uiFont }]}>
          Something went wrong
        </Text>

        {/* Error Message */}
        <Text style={[styles.message, { color: colors.textSecondary, fontFamily: uiFont }]}>
          The app encountered an unexpected error. You can try to recover or restart.
        </Text>

        {/* Error Details Toggle */}
        <Pressable onPress={onToggleDetails} style={styles.detailsToggle}>
          <Text
            style={[styles.detailsToggleText, { color: colors.surfaceBrand, fontFamily: uiFont }]}
          >
            {showDetails ? 'Hide details' : 'Show details'}
          </Text>
          <IconSymbol
            name={showDetails ? 'chevron.up' : 'chevron.down'}
            size={16}
            color={colors.surfaceBrand}
          />
        </Pressable>

        {/* Error Details */}
        {showDetails && error && (
          <ScrollView
            style={[
              styles.detailsContainer,
              {
                backgroundColor: isDark ? colors.surface : colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
            contentContainerStyle={styles.detailsContent}
          >
            <Text style={[styles.errorText, { color: colors.text, fontFamily: uiFont }]}>
              {error.message}
            </Text>
            {errorInfo && (
              <Text style={[styles.stackText, { color: colors.textTertiary, fontFamily: uiFont }]}>
                {errorInfo.componentStack}
              </Text>
            )}
          </ScrollView>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button onPress={onRetry} variant="primary" size="md">
            Try Again
          </Button>
          <Button onPress={onReset} variant="secondary" size="md">
            Reset App
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 16,
  },
  detailsToggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailsContainer: {
    width: '100%',
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 24,
  },
  detailsContent: {
    padding: 12,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 8,
  },
  stackText: {
    fontSize: 12,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
});

export default ErrorBoundary;
