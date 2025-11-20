# Emergency Restoration Guide

## Backup Files Created

1. **COMPLETE_BACKUP_[timestamp].zip** - Full directory backup (current state)
2. **DEVELOPMENT_FILES/AutoNestCut_Clean_Workspace_BACKUP/** - Working extension backup
3. **DEVELOPMENT_FILES/** - All development files and documentation

## Restoration Steps

### If Security Process Fails:

1. **Extract Complete Backup:**
   ```
   Extract COMPLETE_BACKUP_[timestamp].zip to temporary folder
   Delete current directory contents
   Copy all files from extracted backup back to current directory
   ```

2. **Verify Restoration:**
   - Check AutoNestCut.rb exists
   - Check AutoNestCut_Clean_Workspace/Extension/ folder intact
   - Check DEVELOPMENT_FILES/ folder present
   - Test extension loading in SketchUp

### If Partial Corruption:

1. **Restore Extension Only:**
   ```
   Copy from DEVELOPMENT_FILES/AutoNestCut_Clean_Workspace_BACKUP/Extension/
   to AutoNestCut_Clean_Workspace/Extension/
   ```

2. **Restore Main Loader:**
   ```
   Recreate AutoNestCut.rb with original content
   ```

## Backup Verification

- Complete backup: COMPLETE_BACKUP_[timestamp].zip
- Extension backup: DEVELOPMENT_FILES/AutoNestCut_Clean_Workspace_BACKUP/
- Documentation: DEVELOPMENT_FILES/GITBOOK_DOCS/
- Server: DEVELOPMENT_FILES/Server/

## Emergency Contact

If restoration fails, contact development team with:
- Error messages
- Backup file locations
- Steps attempted