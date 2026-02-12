
# FRC Hub Controller Dashboard

A web-based Field Management System Lite styled after the official FRC field management system, with a mock/demo mode for testing without a Raspberry Pi connected.

## Pages & Features

### 1. Match Control Dashboard (Main Page)
- **Large alliance color panels** (Red/Blue) showing real-time scores prominently
- **Ball count display** with individual scoring event log (timestamped)
- **Match state controls**: Disabled → Auto → Teleop → Endgame → Match End, with a timer countdown
- **Match timer** (large, centered) counting down from configurable durations (15s auto, 2:15 teleop, 30s endgame)
- FRC-official dark theme with the recognizable FRC color palette

### 2. System Status Panel
- **Sensor status indicators** — green/yellow/red health for each sensor channel
- **LED strip status** — current mode display (idle, alliance, scoring flash, etc.)
- **Motor status** — on/off, RPM, current draw indicator
- **Connection status** — WebSocket connection to Pi (connected/disconnected/simulated)

### 3. LED Control Panel
- Manual LED mode selector: Idle, Alliance Red, Alliance Blue, Scoring Flash, Countdown, Endgame, Error
- Preview of the current LED animation mode
- Brightness control slider

### 4. Motor Control Panel
- Toggle motor on/off
- Set RPM with a slider
- Trigger "score spin" (brief spin on button press)
- Emergency stop button (large, red, always visible)
- Safety interlock toggle

### 5. Settings Page
- Configure Pi connection (IP address, port)
- Match timing configuration (auto period, teleop period, endgame warning)
- Alliance selection (Red/Blue)
- Toggle demo/simulation mode on or off

### 6. Full-Screen Match Mode
- Distraction-free view showing only: alliance colors, scores, timer, and match state
- Designed for projection/large display during practice matches
- Keyboard shortcuts for match flow control

## Mock/Simulation Mode
- When no Pi is connected, the dashboard runs in demo mode
- Simulated scoring events at random intervals
- All UI elements functional with fake data
- WebSocket connection logic ready to swap in real Pi communication (JSON message protocol)

## Communication Protocol (Reference)
The UI will be built around a structured JSON WebSocket message format:
- `score_update` — ball scored event with timestamp
- `led_mode` — change LED animation mode
- `motor_control` — set motor state/RPM
- `match_state` — send match phase to Pi
- `reset` / `e_stop` — system reset and emergency stop

## Design
- Dark theme matching FRC field management aesthetic
- Monospace fonts for scores/timers
- Bold red/blue alliance accent colors
- Status indicator LEDs (green/yellow/red dots)
- Large, touch-friendly buttons for match control
