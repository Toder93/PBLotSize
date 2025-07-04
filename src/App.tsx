import React, { useState, useMemo } from 'react';

// --- Type Definitions for TypeScript ---

// Defines the props for our InputField component
interface InputFieldProps {
    label: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    placeholder?: string;
    step?: string;
    min?: string;
}

// Defines the props for our ResultDisplay component
interface ResultDisplayProps {
    label: string;
    value: string | number;
    unit?: string;
    color?: string;
}

// Defines the structure for our instrument data
interface InstrumentDetails {
    name: string;
    tickValue: number;
    ticksPerPoint: number;
}

// Defines the valid keys for our instruments
type InstrumentKey = 'NQ' | 'MNQ' | 'ES' | 'MES' | 'GC' | 'MGC';


// --- Helper Components with TypeScript ---

// A reusable, styled input component with typed props
const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, type = "number", placeholder = "0", step = "0.01", min = "0" }) => (
    <div className="w-full">
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            step={step}
            min={min}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
        />
    </div>
);

// A component to display calculated results with typed props
const ResultDisplay: React.FC<ResultDisplayProps> = ({ label, value, unit = '', color = 'text-green-400' }) => (
    <div className="bg-gray-700/50 p-4 rounded-lg flex justify-between items-center">
        <span className="text-gray-300 text-lg">{label}</span>
        <span className={`text-2xl font-bold ${color}`}>{value}{unit}</span>
    </div>
);

// --- Main Application Component ---

export default function App() {
    // --- State Management ---
    const [instrument, setInstrument] = useState<InstrumentKey>('NQ');
    const [stopLossPoints, setStopLossPoints] = useState('10');
    const [riskAmount, setRiskAmount] = useState('100');
    const [isHalfRisk, setIsHalfRisk] = useState(false);
    const [fullRiskValue, setFullRiskValue] = useState('100');

    // --- Instrument Data ---
    const INSTRUMENT_DATA: Record<InstrumentKey, InstrumentDetails> = {
        NQ: { name: 'NQ', tickValue: 5, ticksPerPoint: 4 },
        MNQ: { name: 'MNQ', tickValue: 0.5, ticksPerPoint: 4 },
        ES: { name: 'ES', tickValue: 12.5, ticksPerPoint: 4 },
        MES: { name: 'MES', tickValue: 1.25, ticksPerPoint: 4 },
        GC: { name: 'GC', tickValue: 10, ticksPerPoint: 10 },
        MGC: { name: 'MGC', tickValue: 1, ticksPerPoint: 10 },
    };

    // --- Memoized Calculations ---
    const calculations = useMemo(() => {
        const slPoints = parseFloat(stopLossPoints) || 0;
        const currentRiskAmount = parseFloat(riskAmount) || 0;
        const { tickValue, ticksPerPoint } = INSTRUMENT_DATA[instrument];

        if (slPoints <= 0 || currentRiskAmount <= 0) {
            const riskPerContract = slPoints > 0 ? slPoints * ticksPerPoint * tickValue : 0;
            return {
                rawLotSize: 0,
                floorLotSize: 0,
                riskForFloor: 0,
                ceilLotSize: 0,
                riskForCeil: 0,
                riskForOneContract: riskPerContract,
            };
        }

        const riskPerContract = slPoints * ticksPerPoint * tickValue;
        const rawLotSize = currentRiskAmount / riskPerContract;
        
        const floorLotSize = Math.floor(rawLotSize);
        const riskForFloor = floorLotSize * riskPerContract;
        
        const ceilLotSize = Math.ceil(rawLotSize);
        const riskForCeil = ceilLotSize * riskPerContract;

        return {
            rawLotSize: isNaN(rawLotSize) ? 0 : rawLotSize,
            floorLotSize: isNaN(floorLotSize) ? 0 : floorLotSize,
            riskForFloor: isNaN(riskForFloor) ? 0 : riskForFloor,
            ceilLotSize: isNaN(ceilLotSize) ? 0 : ceilLotSize,
            riskForCeil: isNaN(riskForCeil) ? 0 : riskForCeil,
            riskForOneContract: riskPerContract,
        };
    }, [stopLossPoints, riskAmount, instrument]);
    
    // --- Event Handlers ---
    const handleRiskAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setRiskAmount(value);
        if (!isHalfRisk) {
            setFullRiskValue(value);
        }
    };

    const handleHalfRisk = () => {
        if (!isHalfRisk) {
            setFullRiskValue(riskAmount);
            setRiskAmount((parseFloat(riskAmount) / 2).toString());
            setIsHalfRisk(true);
        }
    };
    
    const handleFullRisk = () => {
        if (isHalfRisk) {
            setRiskAmount(fullRiskValue);
            setIsHalfRisk(false);
        }
    };
    
    const selectedInstrumentData = INSTRUMENT_DATA[instrument];

    return (
        <div className="bg-gray-900 min-h-screen flex items-center justify-center font-sans p-4">
            <div className="w-full max-w-md mx-auto bg-gray-800 shadow-2xl rounded-2xl p-6 md:p-8 space-y-6">
                
                <div className="flex justify-center pb-4">
                    <img 
                        src="https://www.playbit.info/wp-content/uploads/2021/02/Untitled-design-6-png-Photoroom.png" 
                        alt="PlayBit Logo" 
                        className="h-16"
                        onError={(e) => { 
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; 
                            target.src='https://placehold.co/200x64/1f2937/ffffff?text=PlayBit'; 
                        }}
                    />
                </div>

                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white">Futures Lot Size Calculator</h1>
                    <p className="text-gray-400 mt-2">For NQ, ES, GC and their Micros</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Instrument</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(Object.keys(INSTRUMENT_DATA) as InstrumentKey[]).map((instKey) => (
                            <button
                                key={instKey}
                                onClick={() => setInstrument(instKey)}
                                className={`px-2 py-3 rounded-lg text-center font-semibold text-md transition-all duration-200 ${
                                    instrument === instKey
                                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                {INSTRUMENT_DATA[instKey].name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-end space-x-2">
                         <InputField
                            label="Risk per Trade (R)"
                            value={riskAmount}
                            onChange={handleRiskAmountChange}
                            placeholder="e.g., 100"
                        />
                        {isHalfRisk ? (
                             <button onClick={handleFullRisk} className="px-4 py-2 bg-green-600 text-white rounded-lg h-10 hover:bg-green-700 transition-colors whitespace-nowrap">Full R</button>
                        ) : (
                             <button onClick={handleHalfRisk} className="px-4 py-2 bg-yellow-500 text-black rounded-lg h-10 hover:bg-yellow-600 transition-colors whitespace-nowrap">Half R</button>
                        )}
                    </div>
                    <InputField
                        label="Stop Loss (Points)"
                        value={stopLossPoints}
                        onChange={(e) => setStopLossPoints(e.target.value)}
                        placeholder="e.g., 10"
                    />
                </div>

                <div className="border-t border-gray-700 pt-6 space-y-4">
                    <h2 className="text-xl font-semibold text-white text-center mb-4">Calculation Results</h2>
                    <ResultDisplay
                        label="Real Contract Size"
                        value={calculations.rawLotSize.toFixed(2)}
                        unit=" contracts"
                        color="text-blue-400"
                    />
                    {calculations.floorLotSize > 0 ? (
                        <>
                            <ResultDisplay
                                label="Fixed Size (Floor)"
                                value={calculations.floorLotSize.toFixed(0)}
                                unit=" contracts"
                                color="text-green-400"
                            />
                            <ResultDisplay
                                label={`Risk for ${calculations.floorLotSize} contract(s)`}
                                value={`$${calculations.riskForFloor.toFixed(2)}`}
                                color="text-yellow-400"
                            />
                            
                            {calculations.floorLotSize < calculations.ceilLotSize && (
                                <div className="space-y-4 border-t border-gray-700/50 pt-4">
                                    <ResultDisplay
                                        label="Fixed Size (Ceil)"
                                        value={calculations.ceilLotSize.toFixed(0)}
                                        unit=" contracts"
                                        color="text-teal-400"
                                    />
                                    <ResultDisplay
                                        label={`Risk for ${calculations.ceilLotSize} contract(s)`}
                                        value={`$${calculations.riskForCeil.toFixed(2)}`}
                                        color="text-orange-400"
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <ResultDisplay
                            label="Min. Risk for 1 Contract"
                            value={`$${calculations.riskForOneContract.toFixed(2)}`}
                            color="text-red-500"
                        />
                    )}
                </div>

                 <div className="text-center text-xs text-gray-500 pt-4">
                     <p>
                        Tick Value: ${selectedInstrumentData.tickValue.toFixed(2)} | Ticks per Point: {selectedInstrumentData.ticksPerPoint}
                     </p>
                 </div>
            </div>
        </div>
    );
}
