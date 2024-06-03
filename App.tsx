import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { alustaTietokanta } from './database/database';
import { useEffect } from 'react';
import SijainnitLista from './components/SijainnitLista';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';

const App: React.FC = () => {

  useEffect(() => {
    alustaTietokanta();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <View style={styles.container}>
          <SijainnitLista />
          <StatusBar style="auto" />
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
