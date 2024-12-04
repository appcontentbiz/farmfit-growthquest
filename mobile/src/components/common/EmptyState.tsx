import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, IconButton } from 'react-native-paper';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <IconButton
        icon={icon}
        size={48}
        color={theme.colors.primary}
        style={styles.icon}
      />
      <Text style={[styles.title, { color: theme.colors.primary }]}>
        {title}
      </Text>
      <Text style={[styles.description, { color: theme.colors.onSurface }]}>
        {description}
      </Text>
      {action && (
        <IconButton
          icon="plus"
          size={24}
          color={theme.colors.primary}
          onPress={action.onPress}
          style={styles.actionButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 48,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  actionButton: {
    marginTop: 16,
  },
});

export default EmptyState;
