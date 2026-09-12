import React, { useState } from 'react';
import { Wifi, Radio, Server, CheckCircle2, RefreshCw, Cpu, Globe } from 'lucide-react';
import { cncService } from '../cnc/connection';
import { MachineTelemetry } from '../types';

interface WifiSettingsPageProps {
  telemetry: MachineTelemetry;
}

export const WifiSettingsPage: React.FC<WifiSettingsPageProps> = ({ telemetry }) => {
  const [ipInput, setIpInput] = useState<string>(cncService.getIp());
  const [ssidInput, setSsidInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isConnectingSta, setIsConnectingSta] = useState<boolean>(false);
  const [staStatusMsg, setStaStatusMsg] = useState<string>('');
  const [mockNetworks] = useState<string[]>([
    'Home-WiFi-2.4G',
    'Lab-Robotics-Net',
    'MakerSpace_Plotter',
  ]);

  const isSim = telemetry.isSimulated ?? false;

  const handleApplyIp = () => {
    cncService.setIp(ipInput);
    cncService.setMode(false); // Try live connection
  };

  const handleConnectStation = async () => {
    if (!ssidInput) return;
    setIsConnectingSta(true);
    setStaStatusMsg('Sending Wi-Fi credentials to ESP32...');

    if (isSim) {
      setTimeout(() => {
        setIsConnectingSta(false);
        setStaStatusMsg('Connected to ' + ssidInput + ' (Simulated IP: 192.168.1.145)');
      }, 1200);
      return;
    }

    try {
      const body = new URLSearchParams({ ssid: ssidInput, password: passwordInput });
      const res = await fetch(`http://${ipInput}/api/wifi/connect`, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      const data = await res.json();
      setStaStatusMsg(data.message || 'Connecting in background. Check serial monitor or refresh.');
    } catch (e: any) {
      setStaStatusMsg('Error communicating with ESP32 at ' + ipInput);
    } finally {
      setIsConnectingSta(false);
    }
  };

  return (
    <div id="wifi-settings-page" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Wifi className="w-5 h-5 text-cyan-400" />
          <span>Wi-Fi Setup & Machine Connection</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Connect directly to the ESP32 SoftAP or join your local 2.4 GHz home Wi-Fi network
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Machine IP & Mode Toggle */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Direct IP & Operation Mode</span>
          </h3>

          {/* Operation Mode Selector */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              type="button"
              onClick={() => cncService.setMode(true)}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                isSim
                  ? 'bg-purple-950/50 border-purple-600 text-purple-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-purple-400" /> Virtual Simulator
                </span>
                {isSim && <span className="w-2 h-2 rounded-full bg-purple-400" />}
              </div>
              <span className="text-[11px] text-slate-400">
                Run without hardware. Real-time virtual plotter animation.
              </span>
            </button>

            <button
              type="button"
              onClick={() => cncService.setMode(false)}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                !isSim
                  ? 'bg-emerald-950/50 border-emerald-600 text-emerald-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-emerald-400" /> Physical ESP32
                </span>
                {!isSim && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
              </div>
              <span className="text-[11px] text-slate-400">
                Direct WebSocket & REST link to ESP32 DevKit hardware.
              </span>
            </button>
          </div>

          {/* IP Input */}
          <div className="pt-2 text-xs space-y-2">
            <span className="text-slate-400 block">ESP32 IP Address or Hostname</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder="192.168.4.1 or 192.168.1.150"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono text-xs"
              />
              <button
                type="button"
                onClick={handleApplyIp}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition"
              >
                Connect
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Default Access Point IP is <code>192.168.4.1</code>. If connected to home router, enter assigned local IP.
            </p>
          </div>

          {/* Connection Diagnostics */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span>Status:</span>
              <span className={telemetry.connected ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                {telemetry.connected ? 'Active Connection' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Protocol:</span>
              <span className="font-mono text-slate-200">HTTP Port 80 & WebSocket Port 81</span>
            </div>
          </div>
        </div>

        {/* Right: Connect ESP32 to Home Wi-Fi Network */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Join 2.4 GHz Home Wi-Fi (Station Mode)</span>
          </h3>

          <p className="text-xs text-slate-400 leading-relaxed">
            Provide your home Wi-Fi SSID and password. The ESP32 will save them to internal NVS Flash and auto-connect on boot.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>Wi-Fi Network SSID</span>
                <span className="text-[11px] text-cyan-400">2.4 GHz Only</span>
              </div>
              <input
                type="text"
                value={ssidInput}
                onChange={(e) => setSsidInput(e.target.value)}
                placeholder="Your Home Network Name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs"
              />
            </div>

            {/* Quick-fill mock networks */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500">Suggested:</span>
              {mockNetworks.map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setSsidInput(net)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-[11px]"
                >
                  {net}
                </button>
              ))}
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Wi-Fi Password</span>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Network Password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs"
              />
            </div>

            <button
              type="button"
              onClick={handleConnectStation}
              disabled={isConnectingSta || !ssidInput}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs shadow-md transition disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isConnectingSta ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
              <span>Save & Connect to Wi-Fi</span>
            </button>

            {staStatusMsg && (
              <div className="p-3 bg-cyan-950/40 border border-cyan-800 text-cyan-300 rounded-xl text-xs">
                {staStatusMsg}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
