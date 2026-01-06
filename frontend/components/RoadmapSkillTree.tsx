"use client";

import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeTypes,
  Handle,
  Position,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, Tag, Typography } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import styles from '@/styles/roadmapSkillTree.module.css';

const { Text } = Typography;

interface RoadmapSkillTreeProps {
  skills: Record<string, string[]>;
  onSkillClick?: (skill: string, subskill?: string) => void;
}

// Skill Category Node (Yellow nodes - main skills)
const SkillCategoryNode = ({ data }: { data: any }) => {
  const { skill, subskills } = data;

  return (
    <div className={styles.skillCategoryNode}>
      <Handle type="target" position={Position.Top} />
      <Card 
        className={styles.skillCategoryCard}
        bodyStyle={{ padding: '16px 20px', textAlign: 'center' }}
      >
        <div className={styles.skillCategoryTitle}>
          {skill}
        </div>
        <div className={styles.subskillCount}>
          {subskills.length} kỹ năng
        </div>
      </Card>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

// Subskill Node (Smaller nodes branching downward)
const SubskillNode = ({ data }: { data: any }) => {
  const { subskill, skill } = data;

  return (
    <div className={styles.subskillNode}>
      <Handle type="target" position={Position.Top} />
      <Card className={styles.subskillCard} size="small">
        <Text className={styles.subskillText}>{subskill}</Text>
      </Card>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

// Root Node (Top center - Course Title)
const RootNode = ({ data }: { data: any }) => {
  const { title } = data;

  return (
    <div className={styles.rootNode}>
      <Card className={styles.rootCard}>
        <BookOutlined className={styles.rootIcon} />
        <Text strong className={styles.rootTitle}>
          {title}
        </Text>
      </Card>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  rootNode: RootNode,
  skillCategoryNode: SkillCategoryNode,
  subskillNode: SubskillNode,
};

export default function RoadmapSkillTree({
  skills,
  onSkillClick,
}: RoadmapSkillTreeProps) {
  const { nodes, edges } = useMemo(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Add root node at top center
    const rootNode: Node = {
      id: 'root',
      type: 'rootNode',
      position: { x: 500, y: 50 },
      data: { title: 'Lộ trình học tập' },
      draggable: false,
    };
    newNodes.push(rootNode);

    // Calculate layout - horizontal layout for main skills
    const skillEntries = Object.entries(skills);
    const centerY = 200; // Y position for main skills row
    const startX = 200; // Starting X position for first skill
    const skillSpacing = 300; // Horizontal distance between skill categories
    const subskillOffsetY = 150; // Vertical distance from main skill to subskills
    const subskillSpacing = 70; // Vertical spacing between subskills

    // Calculate total width needed and center the skills
    const totalWidth = skillEntries.length * skillSpacing;
    const startXAdjusted = Math.max(200, (1200 - totalWidth) / 2); // Center the skills horizontally

    skillEntries.forEach(([skill, subskills], skillIndex) => {
      const skillX = startXAdjusted + skillIndex * skillSpacing;

      // Add skill category node (yellow node - main skill)
      const skillNode: Node = {
        id: `skill-${skill}`,
        type: 'skillCategoryNode',
        position: { x: skillX, y: centerY },
        data: { skill, subskills },
        draggable: false,
      };
      newNodes.push(skillNode);

      // Edge from root to each main skill
      newEdges.push({
        id: `edge-root-skill-${skill}`,
        source: 'root',
        target: `skill-${skill}`,
        type: 'smoothstep',
        style: { stroke: '#1890ff', strokeWidth: 3 },
      });

      // Add subskill nodes branching downward from each main skill
      // Center subskills horizontally under the main skill
      const subskillCardWidth = 200; // Approximate width of subskill card
      const mainSkillCardWidth = 225; // Approximate width of main skill card
      const subskillStartX = skillX - (subskillCardWidth - mainSkillCardWidth) / 2;
      
      subskills.forEach((subskill, subskillIndex) => {
        const subskillNode: Node = {
          id: `subskill-${skill}-${subskillIndex}`,
          type: 'subskillNode',
          position: {
            x: subskillStartX,
            y: centerY + subskillOffsetY + subskillIndex * subskillSpacing,
          },
          data: { subskill, skill },
          draggable: false,
        };
        newNodes.push(subskillNode);

        // Edge from main skill to subskill (dotted line, vertical)
        newEdges.push({
          id: `edge-skill-${skill}-subskill-${subskillIndex}`,
          source: `skill-${skill}`,
          target: `subskill-${skill}-${subskillIndex}`,
          type: 'straight',
          style: {
            stroke: '#52c41a',
            strokeWidth: 2,
            strokeDasharray: '5,5',
          },
        });
      });
    });

    return { nodes: newNodes, edges: newEdges };
  }, [skills]);

  return (
    <div className={styles.roadmapContainer}>
      <div className={styles.roadmapWrapper}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={1.5}
            defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
          >
            <Background color="#f0f0f0" gap={16} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                if (node.type === 'rootNode') return '#1890ff';
                if (node.type === 'skillCategoryNode') return '#faad14';
                return '#52c41a';
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
}

