"use client";

import React, { useCallback, useMemo } from 'react';
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
import { Card, Tag, Typography, Progress, Tooltip } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  BookOutlined,
} from '@ant-design/icons';
import styles from '@/styles/learningPathFlow.module.css';

const { Text } = Typography;

interface LearningPathDay {
  day: number;
  skill: string;
  subskill: string;
  youtube_links?: string;
  theory?: string;
  question_review?: Array<{
    id: string;
    question_text: string;
    options: string[];
    correct_answer: string;
    level: string;
  }>;
}

interface LearningPathFlowProps {
  learningPath: LearningPathDay[];
  currentDay: number;
  completedDays: number[];
  progressPercentage: number;
  skills: Record<string, string[]>;
  onNodeClick?: (day: number) => void;
}

// Custom Node Component
const DayNode = ({ data }: { data: any }) => {
  const { day, skill, subskill, isCompleted, isCurrent, progress } = data;

  return (
    <div className={styles.dayNode}>
      <Handle type="target" position={Position.Top} />
      
      <Card
        className={`${styles.nodeCard} ${
          isCompleted ? styles.completedNode : ''
        } ${isCurrent ? styles.currentNode : ''}`}
        size="small"
      >
        <div className={styles.nodeHeader}>
          <div className={styles.dayNumber}>
            <BookOutlined /> Ngày {day}
          </div>
          {isCompleted && (
            <CheckCircleOutlined className={styles.checkIcon} />
          )}
        </div>
        
        <Tag color={isCompleted ? 'green' : isCurrent ? 'blue' : 'default'} className={styles.skillTag}>
          {skill}
        </Tag>
        
        <Text className={styles.subskillText} ellipsis={{ tooltip: subskill }}>
          {subskill}
        </Text>
        
        {progress !== undefined && (
          <Progress
            percent={progress}
            size="small"
            showInfo={false}
            strokeColor={isCompleted ? '#52c41a' : '#1890ff'}
            className={styles.nodeProgress}
          />
        )}
      </Card>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  dayNode: DayNode,
};

export default function LearningPathFlow({
  learningPath,
  currentDay,
  completedDays,
  progressPercentage,
  skills,
  onNodeClick,
}: LearningPathFlowProps) {
  // Create nodes and edges from learning path
  const { nodes, edges } = useMemo(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    learningPath.forEach((day, index) => {
      const isCompleted = completedDays.includes(day.day);
      const isCurrent = day.day === currentDay;
      
      // Calculate progress for this specific day
      const dayProgress = isCompleted ? 100 : isCurrent ? 50 : 0;

      const node: Node = {
        id: `day-${day.day}`,
        type: 'dayNode',
        position: {
          x: (index % 3) * 350 + 50, // 3 columns layout
          y: Math.floor(index / 3) * 200 + 50, // Rows
        },
        data: {
          day: day.day,
          skill: day.skill,
          subskill: day.subskill,
          isCompleted,
          isCurrent,
          progress: dayProgress,
        },
        draggable: false,
      };

      newNodes.push(node);

      // Create edge to next day
      if (index < learningPath.length - 1) {
        const edge: Edge = {
          id: `edge-${day.day}-${learningPath[index + 1].day}`,
          source: `day-${day.day}`,
          target: `day-${learningPath[index + 1].day}`,
          type: 'smoothstep',
          animated: isCompleted || isCurrent,
          style: {
            stroke: isCompleted ? '#52c41a' : '#1890ff',
            strokeWidth: 2,
          },
        };
        newEdges.push(edge);
      }
    });

    return { nodes: newNodes, edges: newEdges };
  }, [learningPath, currentDay, completedDays]);

  const onNodeClickHandler = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        const dayNumber = parseInt(node.id.replace('day-', ''));
        onNodeClick(dayNumber);
      }
    },
    [onNodeClick]
  );

  return (
    <div className={styles.flowContainer}>
      <div className={styles.flowHeader}>
        <div className={styles.headerInfo}>
          <Text strong style={{ fontSize: 18 }}>
            Lộ trình học tập
          </Text>
          <div className={styles.progressInfo}>
            <Progress
              percent={progressPercentage}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              style={{ width: 200 }}
            />
            <Text type="secondary" style={{ marginLeft: 12 }}>
              {progressPercentage}% hoàn thành
            </Text>
          </div>
        </div>
        
        {/* Skills Legend */}
        {skills && Object.keys(skills).length > 0 && (
          <div className={styles.skillsLegend}>
            <Text strong style={{ marginRight: 8 }}>Kỹ năng:</Text>
            {Object.keys(skills).map((skill) => (
              <Tag key={skill} color="blue">
                {skill}
              </Tag>
            ))}
          </div>
        )}
      </div>

      <div className={styles.flowWrapper}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClickHandler}
            fitView
            minZoom={0.2}
            maxZoom={1.5}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          >
            <Background color="#f0f0f0" gap={16} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                if (node.data?.isCompleted) return '#52c41a';
                if (node.data?.isCurrent) return '#1890ff';
                return '#d9d9d9';
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
}

