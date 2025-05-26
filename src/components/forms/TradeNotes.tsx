import React, { useState, useEffect } from 'react';

interface TradeNotesProps {
  initialNotes?: string;
  onChange: (combinedNotes: string) => void;
}

interface NotesStructure {
  entryRationale: string;
  exitRationale: string;
  learning: string;
  riskManagement: string;
  psychology: string;
  retradeDecision: string;
  otherRemarks: string;
}

const TradeNotes: React.FC<TradeNotesProps> = ({ initialNotes = '', onChange }) => {
  // Parse initial notes if they exist
  const parseInitialNotes = (): NotesStructure => {
    try {
      // Try to parse as JSON first (for notes saved in our new format)
      try {
        const parsed = JSON.parse(initialNotes);
        if (typeof parsed === 'object' && parsed !== null) {
          return {
            entryRationale: parsed.entryRationale || '',
            exitRationale: parsed.exitRationale || '',
            learning: parsed.learning || '',
            riskManagement: parsed.riskManagement || '',
            psychology: parsed.psychology || '',
            retradeDecision: parsed.retradeDecision || '',
            otherRemarks: parsed.otherRemarks || ''
          };
        }
      } catch (e) {
        // Not JSON, handle as plain text
      }
      
      // For backward compatibility with plain text notes
      return {
        entryRationale: initialNotes,
        exitRationale: '',
        learning: '',
        riskManagement: '',
        psychology: '',
        retradeDecision: '',
        otherRemarks: ''
      };
    } catch (error) {
      console.error('Error parsing notes:', error);
      return {
        entryRationale: '',
        exitRationale: '',
        learning: '',
        riskManagement: '',
        psychology: '',
        retradeDecision: '',
        otherRemarks: ''
      };
    }
  };

  const [notes, setNotes] = useState<NotesStructure>(parseInitialNotes());

  // Combine notes into a single string for backend storage
  const combineNotes = (notesObj: NotesStructure): string => {
    // Only include non-empty sections
    const filteredNotes: Partial<NotesStructure> = {};
    
    Object.entries(notesObj).forEach(([key, value]) => {
      if (value.trim()) {
        filteredNotes[key as keyof NotesStructure] = value.trim();
      }
    });
    
    // If nothing was filled, return empty string
    if (Object.keys(filteredNotes).length === 0) {
      return '';
    }
    
    // Otherwise return JSON string
    return JSON.stringify(filteredNotes);
  };

  // Update parent component when notes change
  useEffect(() => {
    const combined = combineNotes(notes);
    onChange(combined);
  }, [notes, onChange]);

  const handleChange = (field: keyof NotesStructure, value: string) => {
    setNotes(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="mt-6 space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Trade Reflection</h3>
      <p className="text-sm text-gray-500">
        Reflecting on your trades helps improve your trading strategy and decision-making process.
      </p>
      
      {/* Basic Section */}
      <div className="bg-white p-4 rounded-md border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
        <div className="space-y-4">
          <div>
            <label htmlFor="entryRationale" className="block text-sm font-medium text-gray-700">
              Entry Rationale
            </label>
            <textarea
              id="entryRationale"
              name="entryRationale"
              rows={2}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
              placeholder="Why did you enter this trade? What signals or setup did you see?"
              value={notes.entryRationale}
              onChange={e => handleChange('entryRationale', e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="exitRationale" className="block text-sm font-medium text-gray-700">
              Exit Rationale
            </label>
            <textarea
              id="exitRationale"
              name="exitRationale"
              rows={2}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
              placeholder="Why did you exit at this point? Was it planned or reactive?"
              value={notes.exitRationale}
              onChange={e => handleChange('exitRationale', e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Learning Section */}
      <div className="bg-white p-4 rounded-md border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Learning</h4>
        <div>
          <label htmlFor="learning" className="block text-sm font-medium text-gray-700">
            Trade Lessons
          </label>
          <textarea
            id="learning"
            name="learning"
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
            placeholder="What worked well and what didn't? What mistakes were made? What patterns did you observe? What strategy adjustments are needed?"
            value={notes.learning}
            onChange={e => handleChange('learning', e.target.value)}
          />
        </div>
      </div>
      
      {/* Risk Management Section */}
      <div className="bg-white p-4 rounded-md border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Risk Management</h4>
        <div>
          <label htmlFor="riskManagement" className="block text-sm font-medium text-gray-700">
            Risk Assessment
          </label>
          <textarea
            id="riskManagement"
            name="riskManagement"
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
            placeholder="Position sizing decisions? Were stop-loss and take-profit levels appropriate? How was overall portfolio risk? Did you follow your trading rules?"
            value={notes.riskManagement}
            onChange={e => handleChange('riskManagement', e.target.value)}
          />
        </div>
      </div>
      
      {/* Psychological Notes Section */}
      <div className="bg-white p-4 rounded-md border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Psychological Notes</h4>
        <div>
          <label htmlFor="psychology" className="block text-sm font-medium text-gray-700">
            Emotional State
          </label>
          <textarea
            id="psychology"
            name="psychology"
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
            placeholder="How was your emotional state during trading? Any discipline issues like FOMO or revenge trading? How did your confidence level affect your decisions?"
            value={notes.psychology}
            onChange={e => handleChange('psychology', e.target.value)}
          />
        </div>
      </div>
      
      {/* Re-trade Decision */}
      <div className="bg-white p-4 rounded-md border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Re-trade Decision</h4>
        <div>
          <label htmlFor="retradeDecision" className="block text-sm font-medium text-gray-700">
            Would you take this trade again?
          </label>
          <textarea
            id="retradeDecision"
            name="retradeDecision"
            rows={2}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
            placeholder="Would you take this trade again in the same circumstances? Why or why not?"
            value={notes.retradeDecision}
            onChange={e => handleChange('retradeDecision', e.target.value)}
          />
        </div>
      </div>
      
      {/* Other Remarks */}
      <div className="bg-white p-4 rounded-md border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Other Remarks</h4>
        <div>
          <label htmlFor="otherRemarks" className="block text-sm font-medium text-gray-700">
            Additional Notes
          </label>
          <textarea
            id="otherRemarks"
            name="otherRemarks"
            rows={2}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
            placeholder="Any other observations or comments about this trade"
            value={notes.otherRemarks}
            onChange={e => handleChange('otherRemarks', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default TradeNotes; 