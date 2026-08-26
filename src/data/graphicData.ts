/**
 * Structured vector paths, schematic definitions, and domain graphics for KayBiT Snake Detector
 */

export interface CircuitPinDef {
  pinNumber: number;
  name: string;
  type: "power_5v" | "power_3v3" | "ground" | "i2c_sda" | "i2c_scl" | "gpio_pwm" | "uart_tx" | "uart_rx";
  description: string;
  connectedDevice?: string;
}

export const PI5_HARDWARE_PINOUT: CircuitPinDef[] = [
  { pinNumber: 1, name: "3V3 Power", type: "power_3v3", description: "3.3V DC Power Rail" },
  { pinNumber: 2, name: "5V Power", type: "power_5v", description: "5.0V Main Power Rail", connectedDevice: "5V 5A USB-C PD / Buck Converter" },
  { pinNumber: 3, name: "GPIO 2 (SDA1)", type: "i2c_sda", description: "I2C Data Line", connectedDevice: "INA219 Voltage/Current Sensor" },
  { pinNumber: 4, name: "5V Power", type: "power_5v", description: "5.0V Auxiliary Rail", connectedDevice: "Hailo-8L NPU HAT Power" },
  { pinNumber: 5, name: "GPIO 3 (SCL1)", type: "i2c_scl", description: "I2C Clock Line", connectedDevice: "INA219 Voltage/Current Sensor" },
  { pinNumber: 6, name: "Ground", type: "ground", description: "System Ground Reference" },
  { pinNumber: 12, name: "GPIO 18 (PWM0)", type: "gpio_pwm", description: "Hardware PWM", connectedDevice: "Active Cooler 4-Pin Fan Tachometer" },
  { pinNumber: 14, name: "Ground", type: "ground", description: "Ground (Perimeter Relay)" }
];

export const SYSTEM_SCHEMATIC_VECTOR_PATHS = {
  propertyBoundary: "M 10 10 L 90 10 L 90 90 L 10 90 Z",
  houseFootprint: "M 35 35 L 65 35 L 65 65 L 35 65 Z",
  fencePerimeter: "M 5 5 L 95 5 L 95 95 L 5 95 Z",
  solarFlowArrow: "M 20 20 L 50 50",
  cameraSightlines: [
    { from: { x: 70, y: 65 }, to: { x: 90, y: 90 }, fovAngle: 110 },
    { from: { x: 30, y: 35 }, to: { x: 10, y: 10 }, fovAngle: 95 },
    { from: { x: 25, y: 75 }, to: { x: 10, y: 90 }, fovAngle: 100 },
    { from: { x: 75, y: 25 }, to: { x: 90, y: 10 }, fovAngle: 120 }
  ]
};
