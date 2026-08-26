export interface ThreatAttractantFactor {
  title: string;
  points: string[];
}

export const PROPERTY_MAP_METADATA = {
  scaleLabel: "Scale: 1:150 Property Boundary",
  gridSizePx: 40,
  sectorsCount: 4,
  interiorZoneLabel: "RESIDENCE INTERIOR",
  interiorStatus: "✓ SECURE ZONE"
};

export const ZONE_THREAT_ATTRACTANTS: Record<string, ThreatAttractantFactor> = {
  "zone-garden": {
    title: "Snake Attractant Analysis (Garden)",
    points: [
      "Micro-climate: Damp mulch, low stone retaining walls, and rockery crevices",
      "Prey presence: Rodent trails and insect abundance along perimeter fence",
      "Deterrent: High-intensity strobe lighting & ultrasonic frequency emitters active"
    ]
  },
  "zone-entry": {
    title: "Snake Attractant Analysis (Entryway)",
    points: [
      "Micro-climate: Shaded porch eaves, under-deck voids, potted plant water saucers",
      "Human Risk: High foot-traffic transition requiring instant sub-3s siren warning",
      "Deterrent: Automated perimeter warning beacon & doorway IR beam"
    ]
  },
  "zone-storage": {
    title: "Snake Attractant Analysis (Storage)",
    points: [
      "Micro-climate: Dry timber stacks, shaded tool shed base, corrugated iron panels",
      "Brumation Risk: Preferred winter hibernation and nesting habitat for vipers",
      "Deterrent: Secondary perimeter strobe & motion sensor floodlight"
    ]
  },
  "zone-recreational": {
    title: "Snake Attractant Analysis (Pool Deck)",
    points: [
      "Micro-climate: Solar-warmed stone flagstones used for morning ectotherm basking",
      "Water Attractant: Moisture seeking behavior during hot arid weather",
      "Deterrent: Solar boundary sensor and audio frequency deterrent"
    ]
  }
};

export const STATUS_LEGEND_ITEMS = [
  { label: "Clean", colorClass: "bg-emerald-400", dotClass: "bg-emerald-400" },
  { label: "Selected", colorClass: "bg-amber-400", dotClass: "bg-amber-400" },
  { label: "Active Intrusion", colorClass: "bg-red-500", dotClass: "bg-red-500 animate-ping" }
];
