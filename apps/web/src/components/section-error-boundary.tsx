'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="border-border bg-card flex flex-col items-center justify-center rounded-xl border p-8 text-center">
          <p className="text-foreground mb-2 text-sm font-semibold">Algo salió mal</p>
          <p className="text-muted-foreground mb-4 text-sm">
            {this.props.fallbackMessage ?? 'No se pudo cargar esta sección.'}
          </p>
          <Button variant="outline" size="sm" onClick={() => this.setState({ hasError: false })}>
            Reintentar
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
