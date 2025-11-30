import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    name?: string;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        retryCount: 0,
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        // Only update hasError and error, preserve retryCount
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Uncaught error in ErrorBoundary (${this.props.name || 'Global'}):`, error, errorInfo);
    }

    public handleRetry = () => {
        this.props.onReset?.();
        this.setState(prevState => ({
            hasError: false,
            error: null,
            retryCount: prevState.retryCount + 1
        }));
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    <h2 className="text-lg font-semibold mb-2">出错了</h2>
                    <p className="text-sm mb-2">组件 {this.props.name ? `(${this.props.name})` : ''} 发生错误。</p>
                    <details className="text-xs text-gray-600 cursor-pointer">
                        <summary>查看错误详情</summary>
                        <pre className="mt-2 whitespace-pre-wrap">{this.state.error?.stack || this.state.error?.toString()}</pre>
                    </details>
                    <button
                        className="mt-4 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm transition-colors"
                        onClick={this.handleRetry}
                    >
                        重试
                    </button>
                </div>
            );
        }

        return (
            <React.Fragment key={this.state.retryCount}>
                {this.props.children}
            </React.Fragment>
        );
    }
}

export default ErrorBoundary;
