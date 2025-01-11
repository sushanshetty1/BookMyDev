import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const WalletSkeleton = () => {
  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center gap-2 mb-8">
        <div className="h-8 w-8 rounded-md bg-primary/20 animate-pulse" />
        <div className="h-8 w-40 rounded-md bg-primary/20 animate-pulse" />
      </div>

      {/* Balance Card Skeleton */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-12 w-32 bg-primary/20 animate-pulse rounded" />
        </CardContent>
      </Card>

      {/* Wallets Card Skeleton */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="h-6 w-40 bg-muted animate-pulse rounded" />
          <div className="h-4 w-56 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-lg border animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-3 w-32 bg-muted rounded" />
                    <div className="h-3 w-28 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-8 w-8 rounded-lg bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Card Skeleton */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="h-6 w-40 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-lg border animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded bg-muted" />
                  <div className="space-y-2">
                    <div className="h-4 w-48 bg-muted rounded" />
                    <div className="h-3 w-32 bg-muted rounded" />
                    <div className="h-3 w-28 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-4 w-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletSkeleton;