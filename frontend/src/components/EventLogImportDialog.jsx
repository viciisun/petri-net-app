import React, { useState, useRef } from 'react';
import apiService from '../services/apiService';
import usePetriNetStore from '../store/petriNetStore';
import LayoutService from '../services/layoutService';
import styles from './EventLogImportDialog.module.css';

const EventLogImportDialog = ({ isOpen, onClose }) => {
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1); // 1: file selection, 2: configuration
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [config, setConfig] = useState({
    case_id_column: '',
    activity_column: '',
    timestamp_column: '',
    algorithm: 'inductive',
    noise_threshold: 0.0,
    dependency_threshold: 0.5,
    and_threshold: 0.65
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { setNodesAndEdges, layoutDirection } = usePetriNetStore();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setIsLoading(true);

    try {
      // Preview the file
      const response = await apiService.previewEventLog(file);
      setPreviewData(response);
      
      // Auto-detect columns
      const stats = response.statistics;
      setConfig(prev => ({
        ...prev,
        case_id_column: stats.potential_case_id_columns[0] || '',
        activity_column: stats.potential_activity_columns[0] || '',
        timestamp_column: stats.potential_timestamp_columns[0] || ''
      }));
      
      setStep(2);
    } catch (err) {
      setError(`Failed to preview file: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImport = async () => {
    if (!selectedFile || !config.case_id_column || !config.activity_column || !config.timestamp_column) {
      setError('Please select all required columns');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.importEventLog(selectedFile, config);
      
      if (response.success && response.petri_net) {
        // Apply layout to the nodes received from backend
        const { nodes: newNodes, edges: newEdges } = LayoutService.applyLayout(
          response.petri_net.nodes,
          response.petri_net.edges,
          layoutDirection
        );
        
        setNodesAndEdges(newNodes, newEdges);
        onClose();
        
        // Show success message with statistics
        alert(`Successfully imported Event Log!\n\nStatistics:\n- Total traces: ${response.statistics.total_traces}\n- Total events: ${response.statistics.total_events}\n- Unique activities: ${response.statistics.unique_activities}\n- Places: ${response.statistics.places_count}\n- Transitions: ${response.statistics.transitions_count}\n- Edges: ${response.statistics.edges_count}`);
      }
    } catch (err) {
      setError(`Import failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedFile(null);
    setPreviewData(null);
    setConfig({
      case_id_column: '',
      activity_column: '',
      timestamp_column: '',
      algorithm: 'inductive',
      noise_threshold: 0.0,
      dependency_threshold: 0.5,
      and_threshold: 0.65
    });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2>Import Event Log</h2>
          <button onClick={handleClose} className={styles.closeButton}>×</button>
        </div>

        <div className={styles.content}>
          {step === 1 && (
            <div className={styles.step}>
              <h3>Step 1: Select CSV File</h3>
              <p>Choose an Event Log file in CSV format to import.</p>
              
              <div className={styles.fileSelection}>
                <button 
                  onClick={handleFileSelect}
                  className={styles.selectButton}
                  disabled={isLoading}
                >
                  {selectedFile ? selectedFile.name : 'Select CSV File'}
                </button>
                {selectedFile && (
                  <div className={styles.fileInfo}>
                    <span>{selectedFile.name}</span>
                    <span>({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {step === 2 && previewData && (
            <div className={styles.step}>
              <h3>Step 2: Configure Import Settings</h3>
              
              <div className={styles.previewSection}>
                <h4>File Preview</h4>
                <div className={styles.fileStats}>
                  <span>{previewData.total_rows} rows</span>
                  <span>{previewData.columns.length} columns</span>
                </div>
                
                <div className={styles.sampleData}>
                  <table>
                    <thead>
                      <tr>
                        {previewData.columns.map(col => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.sample_data.slice(0, 3).map((row, idx) => (
                        <tr key={idx}>
                          {previewData.columns.map(col => (
                            <td key={col}>{String(row[col] || '').substring(0, 20)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={styles.configSection}>
                <h4>Column Mapping</h4>
                
                <div className={styles.configRow}>
                  <label>Case ID Column *</label>
                  <select 
                    value={config.case_id_column}
                    onChange={(e) => handleConfigChange('case_id_column', e.target.value)}
                  >
                    <option value="">Select column...</option>
                    {previewData.columns.map(col => (
                      <option key={col} value={col}>
                        {col} ({previewData.statistics.unique_values_per_column[col]} unique values)
                      </option>
                    ))}
                  </select>
                  {previewData.statistics.potential_case_id_columns.length > 0 && (
                    <div className={styles.suggestion}>
                      Suggested: {previewData.statistics.potential_case_id_columns.join(', ')}
                    </div>
                  )}
                </div>

                <div className={styles.configRow}>
                  <label>Activity Column *</label>
                  <select 
                    value={config.activity_column}
                    onChange={(e) => handleConfigChange('activity_column', e.target.value)}
                  >
                    <option value="">Select column...</option>
                    {previewData.columns.map(col => (
                      <option key={col} value={col}>
                        {col} ({previewData.statistics.unique_values_per_column[col]} unique values)
                      </option>
                    ))}
                  </select>
                  {previewData.statistics.potential_activity_columns.length > 0 && (
                    <div className={styles.suggestion}>
                      Suggested: {previewData.statistics.potential_activity_columns.join(', ')}
                    </div>
                  )}
                </div>

                <div className={styles.configRow}>
                  <label>Timestamp Column *</label>
                  <select 
                    value={config.timestamp_column}
                    onChange={(e) => handleConfigChange('timestamp_column', e.target.value)}
                  >
                    <option value="">Select column...</option>
                    {previewData.columns.map(col => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                  {previewData.statistics.potential_timestamp_columns.length > 0 && (
                    <div className={styles.suggestion}>
                      Suggested: {previewData.statistics.potential_timestamp_columns.join(', ')}
                    </div>
                  )}
                </div>

                <h4>Discovery Algorithm</h4>
                
                <div className={styles.configRow}>
                  <label>Algorithm</label>
                  <select 
                    value={config.algorithm}
                    onChange={(e) => handleConfigChange('algorithm', e.target.value)}
                  >
                    <option value="inductive">Inductive Miner (Recommended)</option>
                    <option value="alpha">Alpha Miner</option>
                    <option value="heuristics">Heuristics Miner</option>
                  </select>
                </div>

                {config.algorithm === 'inductive' && (
                  <div className={styles.configRow}>
                    <label>Noise Threshold</label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.noise_threshold}
                      onChange={(e) => handleConfigChange('noise_threshold', parseFloat(e.target.value))}
                    />
                    <div className={styles.help}>Higher values filter more noise (0.0 - 1.0)</div>
                  </div>
                )}

                {config.algorithm === 'heuristics' && (
                  <>
                    <div className={styles.configRow}>
                      <label>Dependency Threshold</label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={config.dependency_threshold}
                        onChange={(e) => handleConfigChange('dependency_threshold', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className={styles.configRow}>
                      <label>AND Threshold</label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={config.and_threshold}
                        onChange={(e) => handleConfigChange('and_threshold', parseFloat(e.target.value))}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {step === 1 && (
            <button onClick={handleClose} className={styles.cancelButton}>
              Cancel
            </button>
          )}
          
          {step === 2 && (
            <>
              <button 
                onClick={() => setStep(1)} 
                className={styles.backButton}
                disabled={isLoading}
              >
                Back
              </button>
              <button 
                onClick={handleImport}
                className={styles.importButton}
                disabled={isLoading || !config.case_id_column || !config.activity_column || !config.timestamp_column}
              >
                {isLoading ? 'Importing...' : 'Import'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventLogImportDialog; 