import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Dimensions, Alert, Image } from 'react-native';
import { Card, Button, FAB, Paragraph, Portal, Dialog, TextInput, IconButton } from 'react-native-paper';
import { haeSijainnit, lisaaSijainti, poistaSijainti, lisaaKuva, haeKuvat, poistaKuva, } from '../database/database';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

type Sijainti = {
  id: number;
  nimi: string;
  kuvaus: string;
  leveysaste?: number;
  pituusaste?: number;
  pvm: string;
};
type Kuva = {
  id: number;
  sijaintiId: number;
  kuvaUri: string;
};

const KuvanakymaDialogi = ({ sijaintiId, onClose }: { sijaintiId: number, onClose: () => void }) => {
  const [kuvat, setKuvat] = useState<Kuva[]>([]);

  useEffect(() => {
    haeKuvat(sijaintiId, (onnistui, haetutKuvat) => {
      if (onnistui) {
        setKuvat(haetutKuvat || []);
      }
    });
  }, [sijaintiId]);

  const avaaKamera = async () => {
    let permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      alert('Kameran käyttöön tarvitaan lupa');
      return;
    }

    let pickerResult = await ImagePicker.launchCameraAsync();
    if (!pickerResult.canceled) {
      const pickedImageUri = pickerResult.assets[0].uri;

      lisaaKuva(sijaintiId, pickedImageUri, (onnistui) => {
        if (onnistui) {
          haeKuvat(sijaintiId, (hakuOnnistui, uudetKuvat) => {
            if (hakuOnnistui) {
              setKuvat(uudetKuvat || []);
            }
          });
        }
      });
    }
  };

  const poistaValittuKuva = (kuvaId: number) => {
    Alert.alert("Poista kuva", "Haluatko varmasti poistaa tämän kuvan?", [
      { text: "Peruuta", style: "cancel" },
      {
        text: "Poista", onPress: () => {
          poistaKuva(kuvaId, (onnistui) => {
            if (onnistui) {
              haeKuvat(sijaintiId, (hakuOnnistui, uudetKuvat) => {
                if (hakuOnnistui) {
                  setKuvat(uudetKuvat || []);
                }
              });
            } else {
              Alert.alert("Virhe", "Kuvan poistaminen epäonnistui.");
            }
          });
        }
      }
    ]);
  };

  return (
    <View style={styles.dialog}>
      <FlatList
        data={kuvat}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.kuvaContainer}>
            <Image source={{ uri: item.kuvaUri }} style={styles.kuva} />
            <IconButton icon="delete" onPress={() => poistaValittuKuva(item.id)} />
          </View>
        )}
      />
      <Button onPress={avaaKamera}>Ota kuva</Button>
      <Button onPress={onClose}>Sulje</Button>
    </View>
  );
};


const SijainnitLista: React.FC = () => {

  const { width } = Dimensions.get('window');
  const [sijainnit, setSijainnit] = useState<Sijainti[]>([]);
  const [dialogiNakyvissa, setDialogiNakyvissa] = useState(false);
  const [poistoDialogiNakyvissa, setPoistoDialogiNakyvissa] = useState(false);
  const [poistettavaId, setPoistettavaId] = useState<number | null>(null);

  const [kuvaDialogiNakyvissa, setKuvaDialogiNakyvissa] = useState(false);
  const [valittuSijaintiId, setValittuSijaintiId] = useState<number | null>(null);

  const avaaKuvanakyma = (sijaintiId: number) => {
    setValittuSijaintiId(sijaintiId);
    setKuvaDialogiNakyvissa(true);
  };

  const muotoilePaivamaara = (paivamaaraString: string) => {
    const paivamaara = new Date(paivamaaraString);
    const tunnit = paivamaara.getHours().toString().padStart(2, '0');
    const minuutit = paivamaara.getMinutes().toString().padStart(2, '0');
    return `${tunnit}:${minuutit}   ${paivamaara.getDate()}.${paivamaara.getMonth() + 1}.${paivamaara.getFullYear()}`;
  };

  const [uusiSijainti, setUusiSijainti] = useState({
    id: Math.random(),
    nimi: '',
    kuvaus: '',
    leveysaste: 0,
    pituusaste: 0,
    pvm: new Date().toISOString(),
  });

  useEffect(() => {
    paivitaSijainnit();
  }, []);

  const paivitaSijainnit = () => {
    haeSijainnit((onnistui, data) => {
      if (onnistui && data) {
        setSijainnit(data);
      } else {
        console.error('Sijaintien haku epäonnistui');
        setSijainnit([]);
      }
    });
  };


  const avaaDialogi = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Sijaintioikeuksia ei myönnetty');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});

    setUusiSijainti(sijaintiTiedot => ({
      ...sijaintiTiedot,
      leveysaste: location.coords.latitude,
      pituusaste: location.coords.longitude,
    }));

    setDialogiNakyvissa(true);
  };


  const suljeDialogi = () => setDialogiNakyvissa(false);



  const tallennaSijainti = () => {
    if (uusiSijainti.leveysaste === undefined || uusiSijainti.pituusaste === undefined) {
      alert('Sovellus ei saanut tallennettua koordinaatteja');
      return;
    }

    lisaaSijainti(
      uusiSijainti.nimi,
      uusiSijainti.kuvaus,
      uusiSijainti.leveysaste,
      uusiSijainti.pituusaste,
      uusiSijainti.pvm,
      (onnistui, tulos, virhe) => {
        if (onnistui) {
          console.log('Uusi sijainti tallennettu onnistuneesti.');
          paivitaSijainnit();
          suljeDialogi();
        } else {
          console.error('Sijainnin tallennus epäonnistui.', virhe);
        }
      }
    );
  };


  const avaaPoistoDialogi = (id: number) => {
    setPoistettavaId(id);
    setPoistoDialogiNakyvissa(true);
  };

  const poistaMerkinta = () => {
    if (poistettavaId === null) return;


    poistaSijainti(poistettavaId, (onnistui, virhe) => {
      if (onnistui) {
        console.log("Merkintä poistettu onnistuneesti.");

        paivitaSijainnit();
        setPoistoDialogiNakyvissa(false);
      } else {
        console.error("Merkinnän poisto epäonnistui:", virhe);
      }
    });
  };


  const cardStyle = {
    marginVertical: 8,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    width: width * 0.9,
    minHeight: 100,
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={sijainnit}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={cardStyle}>
            <Card.Title
              title={item.nimi}
              subtitle={`Ajankohta: ${muotoilePaivamaara(item.pvm)}`}
              right={(props) => (
                <>
                  <IconButton {...props} icon="close" onPress={() => avaaPoistoDialogi(item.id)} />
                  <IconButton {...props} icon="camera" onPress={() => avaaKuvanakyma(item.id)} />
                  
                </>
              )}
            />
            <Card.Content>
              <Paragraph>Kuvaus: {item.kuvaus}</Paragraph>
              <Paragraph>Leveysaste: {item.leveysaste?.toFixed(3)}</Paragraph>
              <Paragraph>Pituusaste: {item.pituusaste?.toFixed(3)}</Paragraph>
            </Card.Content>
          </Card>
        )}
      />
      <View style={styles.fabContainer}>
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={avaaDialogi}
        />
      </View>
      <Portal>
        <Dialog visible={poistoDialogiNakyvissa} onDismiss={() => setPoistoDialogiNakyvissa(false)}>
          <Dialog.Title>Haluatko varmasti poistaa merkinnän?</Dialog.Title>
          <Dialog.Actions>
            <Button onPress={() => setPoistoDialogiNakyvissa(false)}>Peruuta</Button>
            <Button onPress={poistaMerkinta}>Poista</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Portal>
        <Dialog visible={dialogiNakyvissa} onDismiss={suljeDialogi}>
          <Dialog.Title>Uusi sijainti</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Nimi" value={uusiSijainti.nimi} onChangeText={(text) => setUusiSijainti({ ...uusiSijainti, nimi: text })} />
            <TextInput label="Kuvaus" value={uusiSijainti.kuvaus} onChangeText={(text) => setUusiSijainti({ ...uusiSijainti, kuvaus: text })} />

          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={tallennaSijainti}>Tallenna</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Portal>
        <Dialog visible={kuvaDialogiNakyvissa} onDismiss={() => setKuvaDialogiNakyvissa(false)}>
          <Dialog.ScrollArea>
            {valittuSijaintiId !== null && (
              <KuvanakymaDialogi
                sijaintiId={valittuSijaintiId}
                onClose={() => setKuvaDialogiNakyvissa(false)}
              />
            )}
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  dialog: {},
  container: {
    flex: 1,
    padding: 20,
  },
  paragraph: {
    fontSize: 16,
  },
  kuvaContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  kuva: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  fabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    bottom: 0,
  },
});

export default SijainnitLista;

