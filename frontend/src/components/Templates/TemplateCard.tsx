"use client";

import { TooltipProvider } from "@radix-ui/react-tooltip"
import { Badge } from "../ui/badge"
import { Card } from "../ui/card"
import { Expandable, ExpandableCard, ExpandableCardContent, ExpandableCardFooter, ExpandableCardHeader, ExpandableContent, ExpandableTrigger } from "../ui/expandable"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { Button } from "../ui/button"
import { Calendar, Clock, MapPin, MessageSquare, Users, Video } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import React, { useRef, useEffect } from "react"

interface TemplateCardProps {
  template: any; // Templates have variable structure
  isActive?: boolean;
  expanded?: boolean;
  onSelect?: () => void;
}

export const TemplateCard = ({ template, isActive = false, expanded = false, onSelect }: TemplateCardProps) => {
  
  const handleCardClick = () => {
    onSelect?.();
  };
  
  return (
    <Expandable
      key={`${template.template_id}-${isActive}`}
      expandDirection="vertical"
      expandBehavior="replace"
      initialDelay={0.2}
      expanded={expanded}
     
    >
      {({ isExpanded }) => (
        <ExpandableTrigger onClick={handleCardClick}>
          <ExpandableCard
            className={` transition-all duration-100 cursor-pointer `}
            collapsedSize={{ width: 450, height: 250 }}
            expandedSize={{ width: 450, height: 600 }}
            hoverToExpand={false}
            expandDelay={200}
            collapseDelay={500}
          >
            <ExpandableCardHeader>
              <div className="flex items-start w-full">
                <div className="flex items-start flex-col gap-2">
                  <Badge variant="default">
                 
                    {template.primary_goal}
                  </Badge>
                  <h3 className="font-semibold text-xl text-foreground">
                    {template.name}
                  </h3>
                  <div className="flex items-center text-sm text-foreground/60">
                  <span className="font-medium">{template.hook_style}</span>
                </div>
                </div>
              </div>
            </ExpandableCardHeader>
            <ExpandableCardContent>
              <div className="flex flex-col items-start justify-between mb-4">
                
                <ExpandableContent preset="blur-md">
                  <div className="flex items-start text-sm text-foreground/60">
                    <span><h2 className="font-bold">Content Density: </h2>{template.text_density}</span>
                  </div>
                </ExpandableContent>
              </div>
              <ExpandableContent preset="blur-md" stagger staggerChildren={0.1}>
                <p className="text-sm text-foreground/80 mb-4">
                  {template.psychology}
                </p>
                <div className="mb-4">
                  <h4 className="font-medium text-sm text-foreground mb-2">Structure:</h4>
                  <div className="space-y-1">
                    {Object.entries(template?.structure || []).map(([key, value], idx) => (
                      <div key={key} className="text-xs text-foreground/70">
                        <span className="font-medium">{idx}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={handleCardClick}
                    className="w-full bg-primary hover:bg-primary/80 text-primary-foreground"
                  >
                    Select Template
                  </Button>
                  
                    <Button className="w-full border border-border hover:bg-foreground/5">
                      Preview
                    </Button>
                  
                </div>
              </ExpandableContent>
            </ExpandableCardContent>
          </ExpandableCard>
        </ExpandableTrigger>
      )}
    </Expandable>
  );
}
