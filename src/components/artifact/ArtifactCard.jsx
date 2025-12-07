import { getIconById, getIconColorById } from "./IconPicker";
import { AppCard } from "../ui/AppCard";
import { useLongPress } from "../../hooks/useLongPress";

export const ArtifactCard = ({
  artifact,
  onSelect,
  isEditMode = false,
  onEnterEditMode,
  onDelete
}) => {
  // Get the icon component and color based on artifact's icon category
  const IconComponent = getIconById(artifact?.icon || "app");
  const iconColor = getIconColorById(artifact?.icon || "app");

  // Long press handler to enter edit mode
  const longPressHandlers = useLongPress(
    () => {
      onEnterEditMode?.();
    },
    {
      delay: 500,
      onClick: () => {
        // Only select if not in edit mode
        if (!isEditMode) {
          onSelect(artifact.id);
        }
      },
    }
  );

  return (
    <AppCard
      icon={IconComponent}
      iconColor={iconColor}
      label={artifact.name}
      multiLineLabel={true}
      isEditMode={isEditMode}
      onDelete={onDelete}
      longPressHandlers={longPressHandlers}
    />
  );
};
