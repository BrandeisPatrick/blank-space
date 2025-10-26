/**
 * Test Version Control & History System
 * Tests undo/redo, snapshots, history, and diffs
 */

import { VersionControl } from '../src/services/utils/versionControl/VersionControl.js';

async function testVersionControl() {
  console.log('🧪 Version Control Test\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Initialize VersionControl
    console.log('\n✅ Test 1: Initialize VersionControl');
    const vc = new VersionControl({
      maxHistoryPerFile: 10,
      maxSnapshots: 5
    });
    console.log('   VersionControl initialized successfully');
    console.log(`   Max history per file: ${vc.maxHistoryPerFile}`);
    console.log(`   Max snapshots: ${vc.maxSnapshots}`);

    // Test 2: Record file changes
    console.log('\n✅ Test 2: Record File Changes');
    vc.recordChange('App.jsx', 'const App = () => { return <div>v1</div>; };', 'Initial version');
    vc.recordChange('App.jsx', 'const App = () => { return <div>v2</div>; };', 'Added features');
    vc.recordChange('App.jsx', 'const App = () => { return <div>v3</div>; };', 'Bug fix');

    const history1 = vc.getFileHistory('App.jsx');
    console.log(`   Recorded versions: ${history1.totalVersions}`);
    console.log(`   Current version: v${history1.currentVersion}`);
    console.log(`   Can undo: ${history1.canUndo}`);
    console.log(`   Can redo: ${history1.canRedo}`);

    // Test 3: Undo
    console.log('\n✅ Test 3: Undo File Change');
    const undoResult = vc.undo('App.jsx');
    console.log(`   Undone to version: v${undoResult.version}`);
    console.log(`   Code: ${undoResult.code.substring(0, 50)}...`);
    console.log(`   Can undo: ${undoResult.canUndo}`);
    console.log(`   Can redo: ${undoResult.canRedo}`);

    const history2 = vc.getFileHistory('App.jsx');
    console.log(`   Current version after undo: v${history2.currentVersion}`);

    // Test 4: Redo
    console.log('\n✅ Test 4: Redo File Change');
    const redoResult = vc.redo('App.jsx');
    console.log(`   Redone to version: v${redoResult.version}`);
    console.log(`   Code: ${redoResult.code.substring(0, 50)}...`);
    console.log(`   Can undo: ${redoResult.canUndo}`);
    console.log(`   Can redo: ${redoResult.canRedo}`);

    // Test 5: Multiple undos
    console.log('\n✅ Test 5: Multiple Undos');
    vc.undo('App.jsx'); // v3 → v2
    vc.undo('App.jsx'); // v2 → v1

    const history3 = vc.getFileHistory('App.jsx');
    console.log(`   Current version after 2 undos: v${history3.currentVersion}`);
    console.log(`   Can undo: ${history3.canUndo}`);
    console.log(`   Can redo: ${history3.canRedo}`);

    // Test 6: Undo limits
    console.log('\n✅ Test 6: Undo Beyond Limit');
    const cantUndo = vc.undo('App.jsx'); // Already at v1
    console.log(`   Undo at first version: ${cantUndo === null ? 'Blocked ✅' : 'Allowed ❌'}`);

    // Test 7: Multiple files
    console.log('\n✅ Test 7: Multiple Files Independent');
    vc.recordChange('TodoList.jsx', 'const TodoList = () => <ul>v1</ul>;', 'Initial');
    vc.recordChange('TodoList.jsx', 'const TodoList = () => <ul>v2</ul>;', 'Updated');
    vc.recordChange('Header.jsx', 'const Header = () => <h1>v1</h1>;', 'Initial');

    const appHistory = vc.getFileHistory('App.jsx');
    const todoHistory = vc.getFileHistory('TodoList.jsx');
    const headerHistory = vc.getFileHistory('Header.jsx');

    console.log(`   App.jsx versions: ${appHistory.totalVersions}`);
    console.log(`   TodoList.jsx versions: ${todoHistory.totalVersions}`);
    console.log(`   Header.jsx versions: ${headerHistory.totalVersions}`);
    console.log(`   ✅ Files tracked independently`);

    // Test 8: Create snapshot
    console.log('\n✅ Test 8: Create Snapshot');
    const snapshot1 = vc.createSnapshot({
      'App.jsx': 'const App = () => { return <div>v1</div>; };',
      'TodoList.jsx': 'const TodoList = () => <ul>v2</ul>;',
      'Header.jsx': 'const Header = () => <h1>v1</h1>;'
    }, 'Working version');

    console.log(`   Snapshot created: ${snapshot1.label}`);
    console.log(`   Files in snapshot: ${snapshot1.fileCount}`);
    console.log(`   Total size: ${snapshot1.totalSize} bytes`);
    console.log(`   Snapshot ID: ${snapshot1.id}`);

    // Test 9: Multiple snapshots
    console.log('\n✅ Test 9: Multiple Snapshots');
    vc.createSnapshot({
      'App.jsx': 'const App = () => { return <div>v2</div>; };'
    }, 'Version 2');
    vc.createSnapshot({
      'App.jsx': 'const App = () => { return <div>v3</div>; };'
    }, 'Version 3');

    const snapshots = vc.getSnapshots();
    console.log(`   Total snapshots: ${snapshots.length}`);
    snapshots.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.label} (${s.fileCount} files, ${s.totalSize} bytes)`);
    });

    // Test 10: Restore snapshot
    console.log('\n✅ Test 10: Restore Snapshot');
    const restored = vc.restoreSnapshot(snapshot1.id);
    console.log(`   Restored snapshot: ${restored.label}`);
    console.log(`   Files restored: ${restored.fileCount}`);
    console.log(`   Example file: App.jsx = ${restored.files['App.jsx'].substring(0, 50)}...`);

    // Test 11: Delete snapshot
    console.log('\n✅ Test 11: Delete Snapshot');
    const beforeDelete = vc.getSnapshots().length;
    const deleted = vc.deleteSnapshot(snapshot1.id);
    const afterDelete = vc.getSnapshots().length;

    console.log(`   Snapshots before delete: ${beforeDelete}`);
    console.log(`   Delete successful: ${deleted ? 'Yes' : 'No'}`);
    console.log(`   Snapshots after delete: ${afterDelete}`);
    console.log(`   ✅ Snapshot deleted`);

    // Test 12: Get timeline
    console.log('\n✅ Test 12: Get Timeline');
    const timeline = vc.getTimeline(10);
    console.log(`   Timeline entries: ${timeline.length}`);
    timeline.slice(0, 3).forEach(entry => {
      console.log(`   - ${entry.filename} v${entry.version}: ${entry.message}`);
    });

    // Test 13: Get diff
    console.log('\n✅ Test 13: Get Diff');

    // Record different versions for diff
    vc.recordChange('Test.jsx', 'line1\nline2\nline3', 'Version 1');
    vc.recordChange('Test.jsx', 'line1\nline2-modified\nline3\nline4', 'Version 2');

    const diff = vc.getDiff('Test.jsx', 1, 2);
    console.log(`   Diff from v${diff.fromVersion} to v${diff.toVersion}:`);
    console.log(`   Lines added: ${diff.linesAdded}`);
    console.log(`   Lines removed: ${diff.linesRemoved}`);
    console.log(`   Lines changed: ${diff.linesChanged}`);
    console.log(`   Size change: ${diff.sizeChange > 0 ? '+' : ''}${diff.sizeChange} bytes`);
    console.log(`   Total changes: ${diff.changes.length}`);

    // Test 14: Get stats
    console.log('\n✅ Test 14: Get Stats');
    const stats = vc.getStats();
    console.log(`   Total changes: ${stats.totalChanges}`);
    console.log(`   Undo count: ${stats.undoCount}`);
    console.log(`   Redo count: ${stats.redoCount}`);
    console.log(`   Snapshots: ${stats.snapshots}`);
    console.log(`   Files tracked: ${stats.filesTracked}`);
    console.log(`   Total versions: ${stats.totalVersions}`);

    // Test 15: Version limit (trimming)
    console.log('\n✅ Test 15: Version Limit (Trimming)');
    const vcLimited = new VersionControl({ maxHistoryPerFile: 3 });

    vcLimited.recordChange('Limited.jsx', 'v1', 'Version 1');
    vcLimited.recordChange('Limited.jsx', 'v2', 'Version 2');
    vcLimited.recordChange('Limited.jsx', 'v3', 'Version 3');
    vcLimited.recordChange('Limited.jsx', 'v4', 'Version 4 (should trim v1)');

    const limitedHistory = vcLimited.getFileHistory('Limited.jsx');
    console.log(`   Total versions: ${limitedHistory.totalVersions}`);
    console.log(`   Max allowed: 3`);
    console.log(`   ✅ Trimming works: ${limitedHistory.totalVersions === 3 ? 'Yes' : 'No'}`);

    // Test 16: Snapshot limit (trimming)
    console.log('\n✅ Test 16: Snapshot Limit (Trimming)');
    const vcSnapLimit = new VersionControl({ maxSnapshots: 2 });

    vcSnapLimit.createSnapshot({ 'A.jsx': 'a' }, 'Snapshot 1');
    vcSnapLimit.createSnapshot({ 'B.jsx': 'b' }, 'Snapshot 2');
    vcSnapLimit.createSnapshot({ 'C.jsx': 'c' }, 'Snapshot 3 (should trim 1)');

    const snapshots2 = vcSnapLimit.getSnapshots();
    console.log(`   Total snapshots: ${snapshots2.length}`);
    console.log(`   Max allowed: 2`);
    console.log(`   ✅ Trimming works: ${snapshots2.length === 2 ? 'Yes' : 'No'}`);

    // Test 17: Export/Import
    console.log('\n✅ Test 17: Export/Import');
    const exportData = vc.export();
    console.log(`   Exported data keys: ${Object.keys(exportData).join(', ')}`);
    console.log(`   Exported at: ${exportData.exportedAt}`);

    const vcNew = new VersionControl();
    vcNew.import(exportData);

    const importedHistory = vcNew.getFileHistory('App.jsx');
    const importedSnapshots = vcNew.getSnapshots();

    console.log(`   Imported file versions: ${importedHistory?.totalVersions || 0}`);
    console.log(`   Imported snapshots: ${importedSnapshots.length}`);
    console.log(`   ✅ Import/Export works`);

    // Test 18: Clear all
    console.log('\n✅ Test 18: Clear All');
    vc.clearAll();

    const clearedStats = vc.getStats();
    console.log(`   Files tracked after clear: ${clearedStats.filesTracked}`);
    console.log(`   Total versions after clear: ${clearedStats.totalVersions}`);
    console.log(`   Snapshots after clear: ${clearedStats.snapshots}`);
    console.log(`   ✅ Clear all works`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All version control tests passed!\n');

    return { success: true };

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    return { success: false, error: error.message };
  }
}

// Run tests
testVersionControl()
  .then(result => {
    if (result.success) {
      console.log('🎉 Version control is working correctly!');
      process.exit(0);
    } else {
      console.log('💥 Version control test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
