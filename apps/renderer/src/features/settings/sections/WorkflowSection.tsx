type WorkflowSectionProps = {
  keepOriginal: boolean;
  notifyOnCompletion: boolean;
  onKeepOriginalChange: (value: boolean) => void;
  onNotifyChange: (value: boolean) => void;
};

export const WorkflowSection = ({
  keepOriginal,
  notifyOnCompletion,
  onKeepOriginalChange,
  onNotifyChange
}: WorkflowSectionProps) => {
  return (
    <section className="settings-group settings-modal-section" id="settings-workflow">
      <p className="settings-section-label">Workflow</p>
      <h3>Original file</h3>

      <label className="checkbox-line">
        <input type="checkbox" checked={keepOriginal} onChange={(event) => onKeepOriginalChange(event.target.checked)} />
        Keep original .webm files
      </label>
      <p className="field-help">
        {keepOriginal
          ? 'Original .webm file will stay unchanged after conversion.'
          : 'Original .webm file will be deleted after successful conversion.'}
      </p>

      <h3>Notifications</h3>
      <label className="checkbox-line">
        <input type="checkbox" checked={notifyOnCompletion} onChange={(event) => onNotifyChange(event.target.checked)} />
        Show desktop popup when conversion finishes
      </label>
      <p className="field-help">
        {notifyOnCompletion
          ? 'Turner will show a system popup on completion or failure, so you can work in other apps meanwhile.(Make sure to allow notifications for Turner in your system settings.)'
          : 'No desktop popup will be shown. Check progress inside Turner manually.'}
      </p>
    </section>
  );
};
