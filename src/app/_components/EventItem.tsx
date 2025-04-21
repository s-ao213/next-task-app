"use client";
import React, { useState } from 'react';
import { Event } from '../_types/event';
import Card from './Card';
import Button from './Button';
import { formatDateTime } from '../utils/dateUtils';

interface EventItemProps {
  event: Event;
}

const EventItem: React.FC<EventItemProps> = ({ event }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card type="event" isImportant={event.isImportant} className="mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{event.title}</h3>
          <p className="text-sm text-gray-600">{event.venue}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{formatDateTime(event.dateTime)}</p>
          {event.duration && (
            <p className="text-xs text-gray-500">所要時間: {event.duration}</p>
          )}
        </div>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? '閉じる' : '詳細'}
      </Button>
      
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          {event.description && (
            <div className="mb-2">
              <h4 className="text-sm font-medium text-gray-700">概要:</h4>
              <p className="text-sm text-gray-600">{event.description}</p>
            </div>
          )}
          {event.items && (
            <div className="mb-2">
              <h4 className="text-sm font-medium text-gray-700">持ち物・服装:</h4>
              <p className="text-sm text-gray-600">{event.items}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default EventItem;