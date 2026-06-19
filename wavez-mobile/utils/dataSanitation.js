export const sanitizeData = (data) => {
  if (!data || !Array.isArray(data)) return [];

  const validRecords = [];
  const grouped = {};

  // Group by beach_name
  data.forEach(row => {
    if (row.beach_name) {
      if (!grouped[row.beach_name]) grouped[row.beach_name] = [];
      grouped[row.beach_name].push(row);
    }
  });

  Object.values(grouped).forEach(group => {
    // Sort ascending by timestamp for rolling window
    group.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    for (let i = 0; i < group.length; i++) {
      const row = group[i];
      const currentTime = new Date(row.timestamp).getTime();
      
      // 1. Flat Wave Anomaly
      // If wave_height < 0.4 and surfer_count > 15, we filter it out.
      if (row.wave_height !== null && row.wave_height !== undefined && row.wave_height < 0.4 && row.surfer_count > 15) {
        continue; // skip this row (invalid)
      }

      // 2. Temporal Spike
      // Find rows within 15 minutes before and 15 minutes after (30-min window centered)
      let windowSum = 0;
      let windowCount = 0;

      for (let j = 0; j < group.length; j++) {
        if (i === j) continue; // exclude current row
        const otherTime = new Date(group[j].timestamp).getTime();
        const diffMinutes = Math.abs(currentTime - otherTime) / (1000 * 60);
        
        if (diffMinutes <= 15) {
          windowSum += group[j].surfer_count;
          windowCount++;
        }
      }

      if (row.surfer_count > 10 && windowCount > 0) {
        const localAvgExclude = windowSum / windowCount;
        if (row.surfer_count > 3 * localAvgExclude) {
          continue; // skip this row (invalid spike)
        }
      }

      // Passed all filters
      validRecords.push(row);
    }
  });

  // Since the UI usually expects the newest items first (descending by ID/timestamp),
  // we sort the overall resulting array descending by timestamp.
  validRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return validRecords;
};
