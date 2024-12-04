import tkinter as tk
from tkinter import ttk, messagebox
import numpy as np
from typing import Dict, Optional
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.figure import Figure
from .quantum_predictor import QuantumPredictor, QuantumPredictionError
from .validation import ValidationError, EnvironmentalFactor, ENVIRONMENTAL_LIMITS

class QuantumAnalysisUI:
    def __init__(self, master: tk.Tk):
        self.master = master
        self.master.title("Quantum Growth Analysis")
        self.master.geometry("800x600")
        
        # Initialize predictor
        try:
            self.predictor = QuantumPredictor()
        except QuantumPredictionError as e:
            messagebox.showerror("Error", str(e))
            master.destroy()
            return

        self._create_widgets()
        self._create_layout()

    def _create_widgets(self):
        # Control Frame
        self.control_frame = ttk.LabelFrame(self.master, text="Environmental Controls", padding=10)
        self.sliders = {}
        
        # Create sliders for each environmental factor
        for factor in EnvironmentalFactor:
            limits = ENVIRONMENTAL_LIMITS[factor]
            frame = ttk.Frame(self.control_frame)
            
            # Label with current value
            value_var = tk.StringVar(value=f"{limits.optimal_range[0]:.1f} {limits.unit}")
            label = ttk.Label(frame, text=factor.value.replace('_', ' ').title())
            value_label = ttk.Label(frame, textvariable=value_var)
            
            # Slider
            slider = ttk.Scale(
                frame,
                from_=limits.min_value,
                to=limits.max_value,
                orient='horizontal',
                length=200,
                value=limits.optimal_range[0]
            )
            
            # Update value label when slider moves
            def update_value(val, v=value_var, unit=limits.unit):
                v.set(f"{float(val):.1f} {unit}")
            slider.configure(command=update_value)
            
            self.sliders[factor] = {
                'slider': slider,
                'value_var': value_var,
                'frame': frame,
                'label': label,
                'value_label': value_label
            }

        # Analysis button
        self.analyze_button = ttk.Button(
            self.control_frame,
            text="Analyze Growth",
            command=self._run_analysis
        )

        # Results Frame
        self.results_frame = ttk.LabelFrame(self.master, text="Analysis Results", padding=10)
        
        # Create matplotlib figure for compact visualization
        self.fig = Figure(figsize=(6, 3), dpi=100)
        self.canvas = FigureCanvasTkAgg(self.fig, master=self.results_frame)
        
        # Results text
        self.results_text = tk.Text(self.results_frame, height=8, width=50)
        self.results_text.config(state='disabled')

    def _create_layout(self):
        # Layout control frame
        self.control_frame.pack(fill='x', padx=10, pady=5)
        
        for factor_widgets in self.sliders.values():
            frame = factor_widgets['frame']
            frame.pack(fill='x', pady=2)
            
            factor_widgets['label'].pack(side='left')
            factor_widgets['value_label'].pack(side='right')
            factor_widgets['slider'].pack(side='right', padx=5)

        self.analyze_button.pack(pady=10)

        # Layout results frame
        self.results_frame.pack(fill='both', expand=True, padx=10, pady=5)
        self.canvas.get_tk_widget().pack(fill='both', expand=True)
        self.results_text.pack(fill='both', expand=True, padx=5, pady=5)

    def _get_environmental_data(self) -> Dict[str, float]:
        return {
            factor.value: float(self.sliders[factor]['slider'].get())
            for factor in EnvironmentalFactor
        }

    def _update_visualization(self, results: Dict):
        self.fig.clear()
        
        # Create compact subplot layout
        gs = self.fig.add_gridspec(2, 2, height_ratios=[1, 1], hspace=0.3, wspace=0.3)
        
        # Growth potential gauge
        ax1 = self.fig.add_subplot(gs[0, 0])
        self._draw_gauge(
            ax1, 
            results['growth_potential'],
            'Growth\nPotential',
            cmap='RdYlGn'
        )
        
        # Environmental score gauge
        ax2 = self.fig.add_subplot(gs[0, 1])
        self._draw_gauge(
            ax2,
            results['environmental_score'],
            'Environmental\nScore',
            cmap='RdYlGn'
        )
        
        # History plot
        ax3 = self.fig.add_subplot(gs[1, :])
        history = results['history']
        if history:
            values = [entry['growth_potential'] for entry in history]
            ax3.plot(values, 'g-')
            ax3.set_title('Growth Potential History')
            ax3.set_ylim(0, 1)
            ax3.grid(True, alpha=0.3)
        
        self.canvas.draw()

    def _draw_gauge(self, ax, value: float, label: str, cmap: str = 'RdYlGn'):
        # Create simple gauge visualization
        colors = plt.cm.get_cmap(cmap)(np.linspace(0, 1, 256))
        ax.add_patch(plt.Rectangle((0, 0), 1, 0.3, fc=colors[int(value * 255)]))
        ax.text(0.5, 0.5, f'{value:.1%}', ha='center', va='center', fontsize=10)
        ax.text(0.5, 0.8, label, ha='center', va='center', fontsize=8)
        ax.set_xlim(-0.1, 1.1)
        ax.set_ylim(0, 1)
        ax.axis('off')

    def _update_results_text(self, results: Dict):
        self.results_text.config(state='normal')
        self.results_text.delete(1.0, tk.END)
        
        # Add recommendations
        if results['recommendations']:
            self.results_text.insert(tk.END, "Recommendations:\n", 'heading')
            for rec in results['recommendations']:
                self.results_text.insert(tk.END, f"• {rec}\n")
        
        # Add warnings
        if results['warnings']:
            self.results_text.insert(tk.END, "\nWarnings:\n", 'heading')
            for warning in results['warnings']:
                self.results_text.insert(tk.END, f"• {warning}\n")
        
        self.results_text.config(state='disabled')

    def _run_analysis(self):
        try:
            # Get environmental data
            env_data = self._get_environmental_data()
            
            # Run prediction
            results = self.predictor.predict(env_data)
            
            # Update visualization
            self._update_visualization(results)
            
            # Update results text
            self._update_results_text(results)
            
        except (ValidationError, QuantumPredictionError) as e:
            messagebox.showerror("Error", str(e))
        except Exception as e:
            messagebox.showerror("Unexpected Error", f"An unexpected error occurred: {str(e)}")

def run_quantum_analysis():
    root = tk.Tk()
    app = QuantumAnalysisUI(root)
    root.mainloop()
