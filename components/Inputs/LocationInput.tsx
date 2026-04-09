import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useCallback, useRef } from "react";
import placekit, { PKResult } from "@placekit/client-js";
import { colors } from "@/constants/theme";
import { usePrefs } from "@/store/zustand";

const API_KEY = process.env.EXPO_PUBLIC_PLACEKIT_API_KEY ?? "";
const pk = placekit(API_KEY);

type Props = {
  llSetter: (ll: [number, number]) => void;
  ll?: [number, number];
  onLocationName?: (name: string) => void;
};

const LocationInput = ({ llSetter, ll, onLocationName }: Props) => {
  const [value, setValue] = useState("");
  const [results, setResults] = useState<PKResult[]>([]);
  const [loading, setLoading] = useState(false);
    
  const [selected, setSelected] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {prefs} = usePrefs()
  const parseCoords = useCallback((item: PKResult): [number, number] => {
    const parts = item.coordinates.split(",").map((s) => parseFloat(s.trim()));
    return [parts[0], parts[1]];
  }, []);

  useEffect(() => {

    if (!ll || (ll[0] !== 0 && ll[1] !== 0)) return;
    const reverse = async () => {
      try {
        const res = await pk.reverse({
          maxResults: 1,
          coordinates: `${prefs.defaultLat},${prefs.defaultLng}`,
          language: "en",
        });
    
        if (res.results.length > 0) {
          const place = res.results[0];
          const label = place.name ?? place.city ?? "";
          setValue(label);
          
          setSelected(true);
          llSetter(parseCoords(place));
          onLocationName?.(label);
        }
   
      } catch (err) {
        console.error("Reverse geocode error:", err);
      }
    };
    reverse();
  }, []);


  useEffect(() => {
    if (selected) return;
    if (value.length < 3) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await pk.search(value, { maxResults: 4 });
        setResults(res.results);
      } catch (err) {
        console.error("PlaceKit search error:", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, selected]);

  const handleSelect = (item: PKResult) => {
    const label = item.name ?? item.city ?? value;
    llSetter(parseCoords(item));
    onLocationName?.(label);
    setValue(label);
    setResults([]);
    setSelected(true);
  };

  const handleClear = () => {
    setValue("");
    setResults([]);
    setSelected(false);
    llSetter([0, 0]);
    onLocationName?.("");
  };

  return (
    <View className="flex-1">
      {/* ── Input ── */}
      <View className="flex-row  items-center bg-pill border border-primary/40 rounded-xl px-3.5 py-2.5 gap-2">
        <TextInput
          className="flex-1 text-sm  text-text"
          value={value}
          onChangeText={(v) => {
            setValue(v);
            setSelected(false);
          }}
          placeholder="Search location… e.g. V8W"
          placeholderTextColor={colors.secondary}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          
        />
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : value.length > 0 ? (
          <Pressable onPress={handleClear}>
            <Text className="text-secondary text-sm">✕</Text>
          </Pressable>
        ) : null}
      </View>

      {/* ── Results dropdown ── */}
      {results.length > 0 && !selected && (
        <View className="mt-1 bg-pill border border-gray-500/20 rounded-xl overflow-hidden">
          {results.map((item, i) => {
            const label = [item.name, item.city, item.administrative]
              .filter(Boolean)
              .join(", ");
            const sublabel = [item.county, item.country]
              .filter(Boolean)
              .join(", ");
            const isLast = i === results.length - 1;

            return (
              <Pressable
                key={`${item.coordinates}-${i}`}
                onPress={() => handleSelect(item)}
                className={`flex-row items-center px-3.5 py-3 gap-2.5 active:bg-primary/10 ${
                  !isLast ? "border-b border-primary/15" : ""
                }`}
              >
                {/* Pin dot */}
                <View className="w-2 h-2 rounded-full bg-primary mt-0.5 shrink-0" />

                <View className="flex-1">
                  <Text
                    className="text-[13px] font-semibold text-text"
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                  {sublabel ? (
                    <Text
                      className="text-[11px] text-primary mt-0.5"
                      numberOfLines={1}
                    >
                      {sublabel}
                    </Text>
                  ) : null}
                </View>

                <Text className="text-[10px] text-primary/50" numberOfLines={1}>
                  {item.coordinates
                    .split(",")
                    .map((c) => parseFloat(c).toFixed(2))
                    .join(", ")}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* ── No results ── */}
      {!loading && value.length >= 3 && results.length === 0 && !selected && (
        <View className="mt-1 bg-pill border border-primary/20 rounded-xl p-3.5">
          <Text className="text-[11px] text-primary">
            No locations found for "{value}"
          </Text>
        </View>
      )}
    </View>
  );
};

export default LocationInput;
