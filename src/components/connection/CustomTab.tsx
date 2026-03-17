import { useState, useEffect } from "react";
import { useConnectionStore } from "../../stores/connectionStore";

const PRESET_COLORS = [
  { name: "Green", hex: "#22c55e" },
  { name: "Red", hex: "#ef4444" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Orange", hex: "#f97316" },
  { name: "Purple", hex: "#a855f7" },
];

export function CustomTab() {
  const { selectedConnection, selectConnection } = useConnectionStore();

  const [name, setName] = useState(selectedConnection?.name || "");
  const [color, setColor] = useState(selectedConnection?.color || "");
  const [customHex, setCustomHex] = useState("");

  useEffect(() => {
    if (selectedConnection) {
      setName(selectedConnection.name || "");
      setColor(selectedConnection.color || "");
    }
  }, [selectedConnection]);

  const applyChanges = (newName?: string, newColor?: string) => {
    if (!selectedConnection) return;
    selectConnection({
      ...selectedConnection,
      name: newName ?? name,
      color: newColor ?? color,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Name */}
      <div>
        <label className="mb-1 block text-xs text-text-secondary">
          Display Name (optional)
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            applyChanges(e.target.value, undefined);
          }}
          placeholder={selectedConnection?.serverName || "Defaults to server name"}
          className="w-full rounded border border-bg-tertiary bg-bg-input px-3 py-1.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent-hover focus:outline-none"
        />
      </div>

      {/* Color Picker */}
      <div>
        <label className="mb-2 block text-xs text-text-secondary">
          Color
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.hex}
              onClick={() => {
                setColor(preset.hex);
                setCustomHex("");
                applyChanges(undefined, preset.hex);
              }}
              className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                color === preset.hex
                  ? "border-text-primary scale-110"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: preset.hex }}
              title={preset.name}
            />
          ))}
          {/* No color option */}
          <button
            onClick={() => {
              setColor("");
              setCustomHex("");
              applyChanges(undefined, "");
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs text-text-secondary hover:scale-110 ${
              !color ? "border-text-primary scale-110" : "border-bg-tertiary"
            }`}
            title="No color"
          >
            &times;
          </button>
        </div>

        {/* Custom hex input */}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            placeholder="#hex"
            maxLength={7}
            className="w-24 rounded border border-bg-tertiary bg-bg-input px-2 py-1 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent-hover focus:outline-none"
          />
          <button
            onClick={() => {
              if (/^#[0-9a-fA-F]{6}$/.test(customHex)) {
                setColor(customHex);
                applyChanges(undefined, customHex);
              }
            }}
            disabled={!/^#[0-9a-fA-F]{6}$/.test(customHex)}
            className="rounded border border-bg-tertiary bg-bg-secondary px-3 py-1 text-sm text-text-primary hover:bg-bg-tertiary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply
          </button>
          {color && (
            <div
              className="h-6 w-6 rounded border border-bg-tertiary"
              style={{ backgroundColor: color }}
            />
          )}
        </div>
      </div>

      {!selectedConnection && (
        <p className="text-sm text-text-secondary">
          Select or create a connection first to set custom properties.
        </p>
      )}
    </div>
  );
}
