import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, FAB, Portal, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import ComparativeAnalysis from '../../components/analytics/ComparativeAnalysis';
import DataExportService from '../../services/DataExportService';
import * as Sharing from 'expo-sharing';

const ComparativeAnalyticsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const exportPath = await DataExportService.exportData({
        format: {
          type: 'xlsx',
          includeCharts: true,
          includePredictions: true,
          includeWeatherData: true,
        },
        compressionLevel: 9,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(exportPath, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Export Comparative Analysis',
        });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Comparative Analysis" />
        <Appbar.Action icon="information" onPress={() => {}} />
      </Appbar.Header>

      <ComparativeAnalysis />

      <Portal>
        <FAB
          icon="file-export"
          label="Export"
          loading={isExporting}
          style={[
            styles.fab,
            {
              backgroundColor: theme.colors.primary,
            },
          ]}
          onPress={handleExport}
        />
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default ComparativeAnalyticsScreen;
