import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SearchBar } from '@/components/search-bar';
import { SongRow } from '@/components/song-row';
import { ProfileSong, searchSongs } from '@/data/songs';
import { useSongPreview } from '@/hooks/use-song-preview';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

// Ajustes de la búsqueda
const MIN_CHARS = 2;
const DEBOUNCE_MS = 350; // espera a que dejes de escribir antes de buscar

type Props = {
  visible: boolean;
  onPick: (song: ProfileSong) => void;
  onClose: () => void;
};

/** Hoja para buscar una canción en Apple Music y elegirla para el perfil. */
export function SongPicker({ visible, onPick, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {/* Se monta solo al abrir: así la búsqueda empieza vacía y el audio se libera al cerrar */}
      {visible && <SongSearch onPick={onPick} onClose={onClose} />}
    </Modal>
  );
}

function SongSearch({ onPick, onClose }: Omit<Props, 'visible'>) {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<{ term: string; songs: ProfileSong[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const preview = useSongPreview();

  const query = term.trim();
  const searchable = query.length >= MIN_CHARS;

  useEffect(() => {
    if (!searchable) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchSongs(query, controller.signal)
        .then((songs) => {
          setResults({ term: query, songs });
          setError(null);
        })
        .catch((e) => {
          if (!controller.signal.aborted) setError(`No se ha podido buscar: ${e.message}`);
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, searchable]);

  const loading = searchable && results?.term !== query && !error;
  const songs = searchable && results ? results.songs : [];

  const pick = (song: ProfileSong) => {
    preview.stop();
    onPick(song);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Añadir canción</Text>
        <Pressable onPress={onClose} hitSlop={10}>
          <Text style={styles.cancel}>Cancelar</Text>
        </Pressable>
      </View>

      <View style={styles.search}>
        <SearchBar value={term} onChangeText={setTerm} placeholder="Busca una canción o artista" />
      </View>

      <FlatList
        data={songs}
        keyExtractor={(song) => song.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={loading ? <ActivityIndicator color={theme.accent} /> : undefined}
        ListEmptyComponent={
          loading ? undefined : (
            <Text style={styles.empty}>
              {error ??
                (searchable
                  ? 'No hay canciones con ese nombre.'
                  : 'Elige la canción que suena en tu perfil. Dale al play para oír un trozo.')}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <SongRow
            song={item}
            playing={preview.isPlaying(item)}
            onTogglePlay={() => preview.toggle(item)}
            onPress={() => pick(item)}
          />
        )}
        ListFooterComponent={
          songs.length > 0 ? <Text style={styles.credit}>Fragmentos de Apple Music</Text> : undefined
        }
      />
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 14,
    },
    title: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
    cancel: { color: theme.accent, fontSize: 16, fontWeight: '700' },
    search: { paddingHorizontal: 20, paddingBottom: 12 },
    list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
    separator: { height: 14 },
    empty: {
      color: COLORS.muted,
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      paddingHorizontal: 12,
      paddingTop: 24,
    },
    credit: { color: COLORS.muted, fontSize: 12, textAlign: 'center', marginTop: 24 },
  });
