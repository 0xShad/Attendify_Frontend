"use client";

import React from "react";
import { IconSchool, IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  onAddSchool?: () => void;
  isFiltered?: boolean;
}

export function EmptyState({ onAddSchool, isFiltered = false }: EmptyStateProps) {
  return (
    <div className="col-span-full">
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <IconSchool className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No schools found</h3>
            <p className="text-muted-foreground mb-4">
              {isFiltered 
                ? "Try adjusting your search or filters"
                : "Get started by adding your first school"
              }
            </p>
            {!isFiltered && onAddSchool && (
              <Button onClick={onAddSchool}>
                <IconPlus className="h-4 w-4 mr-2" />
                Add School
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
