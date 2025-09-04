import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEvents } from '../contexts/EventContext';
import { useToast } from './ui/Toast';
import { QRValidationResult } from '../types';
import { 
  QrCode, 
  Camera, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  Calendar,
  MapPin,
  Clock
} from 'lucide-react';

interface QRScannerProps {
  eventId?: string;
  eventTitle?: string;
  onScanComplete?: (result: QRValidationResult) => void;
  scannedBy?: string;
  location?: string;
}

const QRScanner: React.FC<QRScannerProps> = ({ 
  eventId, 
  eventTitle,
  onScanComplete,
  scannedBy = 'admin',
  location = 'event-gate'
}) => {
  const { validateQRCode } = useEvents();
  const { addToast } = useToast();
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<QRValidationResult | null>(null);
  const [manualQRData, setManualQRData] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerElementId = 'qr-reader';

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const startScanning = () => {
    setIsScanning(true);
    setScanResult(null);
    
    scannerRef.current = new Html5QrcodeScanner(
      scannerElementId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    scannerRef.current.render(
      (decodedText) => {
        handleQRScan(decodedText);
      },
      (error) => {
        // Silent error handling for scanning
        console.debug('QR scan error:', error);
      }
    );
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleQRScan = async (qrData: string) => {
    try {
      const result = await validateQRCode(qrData, eventId, scannedBy, location);
      setScanResult(result);
      
      if (result.valid) {
        addToast({
          type: 'success',
          title: 'Valid QR Code',
          message: 'Attendance marked successfully'
        });
        stopScanning();
      } else {
        addToast({
          type: 'error',
          title: 'Invalid QR Code',
          message: result.reason || 'QR code validation failed'
        });
      }
      
      onScanComplete?.(result);
    } catch (error) {
      console.error('QR validation error:', error);
      addToast({
        type: 'error',
        title: 'Scan Error',
        message: 'Failed to validate QR code'
      });
    }
  };

  const handleManualValidation = async () => {
    if (!manualQRData.trim()) {
      addToast({
        type: 'warning',
        title: 'No Data',
        message: 'Please enter QR code data'
      });
      return;
    }

    await handleQRScan(manualQRData);
    setManualQRData('');
  };

  const renderScanResult = () => {
    if (!scanResult) return null;

    const { valid, registration, reason, scanLog } = scanResult;

    return (
      <div className={`mt-6 p-6 rounded-lg border-2 ${
        valid ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          {valid ? (
            <CheckCircle className="w-8 h-8 text-green-600" />
          ) : (
            <XCircle className="w-8 h-8 text-red-600" />
          )}
          <h3 className={`text-xl font-semibold ${
            valid ? 'text-green-800' : 'text-red-800'
          }`}>
            {valid ? 'Valid QR Code' : 'Invalid QR Code'}
          </h3>
        </div>

        {!valid && reason && (
          <div className="mb-4 p-3 bg-red-100 rounded-lg">
            <p className="text-red-800 font-medium">Reason: {reason}</p>
          </div>
        )}

        {valid && registration && (
          <div className="space-y-4">
            {/* Student Info */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <User className="w-5 h-5" />
                Student Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {registration.user?.name}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {registration.user?.email}
                </div>
                <div>
                  <span className="font-medium">Registration ID:</span> {registration.registrationId}
                </div>
                <div>
                  <span className="font-medium">Department:</span> {registration.user?.department}
                </div>
              </div>
            </div>

            {/* Event Info */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Event Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Event:</span> 
                  {registration.event?.title}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(registration.event?.date).toLocaleDateString()} at {registration.event?.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{registration.event?.venue}</span>
                </div>
              </div>
            </div>

            {/* Scan Info */}
            {scanLog && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Scan Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Scanned By:</span> {scanLog.scannedBy}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {scanLog.location}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span> {new Date(scanLog.scannedAt).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> 
                    <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      {scanLog.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Registration Status */}
            <div className="bg-green-100 p-3 rounded-lg">
              <p className="text-green-800 font-medium text-center">
                ✓ Attendance Marked Successfully
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => setScanResult(null)}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Scan Another QR Code
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-6">
        <QrCode className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          QR Code Scanner
        </h2>
        {eventTitle ? (
          <p className="text-gray-600">
            Scanning for: <span className="font-semibold">{eventTitle}</span>
          </p>
        ) : (
          <p className="text-gray-600">
            Scan QR codes to mark attendance
          </p>
        )}
      </div>

      {/* Scanner Controls */}
      <div className="mb-6 flex justify-center gap-4">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Camera className="w-5 h-5" />
            Start Camera Scanner
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <XCircle className="w-5 h-5" />
            Stop Scanner
          </button>
        )}

        <button
          onClick={() => setShowManualInput(!showManualInput)}
          className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <AlertCircle className="w-5 h-5" />
          Manual Input
        </button>
      </div>

      {/* Camera Scanner */}
      {isScanning && (
        <div className="mb-6">
          <div 
            id={scannerElementId} 
            className="mx-auto"
            style={{ maxWidth: '400px' }}
          />
        </div>
      )}

      {/* Manual Input */}
      {showManualInput && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Manual QR Data Input</h3>
          <div className="space-y-3">
            <textarea
              value={manualQRData}
              onChange={(e) => setManualQRData(e.target.value)}
              placeholder="Paste QR code data here..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={4}
            />
            <button
              onClick={handleManualValidation}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Validate QR Data
            </button>
          </div>
        </div>
      )}

      {/* Scan Result */}
      {renderScanResult()}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Point your camera at the QR code to scan automatically</li>
          <li>• Ensure the QR code is well-lit and clearly visible</li>
          <li>• Use manual input if the camera scanner is not working</li>
          <li>• Each QR code can only be used once per event</li>
        </ul>
      </div>
    </div>
  );
};

export default QRScanner;
