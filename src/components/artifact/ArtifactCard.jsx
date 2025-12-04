import { getIconById, getIconColorById } from './IconPicker';
import { AppCard } from '../ui/AppCard';

export const ArtifactCard = ({ artifact, onSelect }) => {
  // Get the icon component and color based on artifact's icon category
  const IconComponent = getIconById(artifact?.icon || 'app');
  const iconColor = getIconColorById(artifact?.icon || 'app');

  return (
    <AppCard
      icon={IconComponent}
      iconColor={iconColor}
      label={artifact.name}
      onClick={() => onSelect(artifact.id)}
      multiLineLabel={true}
    />
  );
};
