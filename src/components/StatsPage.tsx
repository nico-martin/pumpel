import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTrainings } from '@/db/trainings';
import { getAllSets } from '@/db/sets';
import { getAllExercises } from '@/db/exercises';
import { getAllRounds } from '@/db/rounds';
import { getUser } from '@/db/user';
import type { Training, Set, Exercise, Round } from '@/db/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Copy, Check } from 'lucide-react';

type DateRange = {
  start: number;
  end: number;
};

export function StatsPage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = Date.now();
    const start = end - 30 * 24 * 60 * 60 * 1000; // Last 30 days
    return { start, end };
  });
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [sets, setSets] = useState<Set[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (exercises.length > 0) {
      filterData();
    }
  }, [dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [user, allTrainings, allSets, allExercises, allRounds] = await Promise.all([
        getUser(),
        getAllTrainings(),
        getAllSets(),
        getAllExercises(),
        getAllRounds(),
      ]);
      if (user) {
        setUserName(user.name);
      }
      setExercises(allExercises);
      setRounds(allRounds);
      filterDataWithAll(allTrainings, allSets);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDataWithAll = async (
    allTrainings: Training[],
    allSets: Set[]
  ) => {
    const filteredTrainings = allTrainings.filter(
      (t) => t.startTime >= dateRange.start && t.startTime <= dateRange.end && t.endTime > 0
    );
    const trainingIds = new Set(filteredTrainings.map((t) => t.id));
    const filteredSets = allSets.filter((s) => trainingIds.has(s.trainingId));

    setTrainings(filteredTrainings);
    setSets(filteredSets);
  };

  const filterData = async () => {
    const [allTrainings, allSets] = await Promise.all([
      getAllTrainings(),
      getAllSets(),
    ]);
    filterDataWithAll(allTrainings, allSets);
  };

  const setPreset = (days: number) => {
    const end = Date.now();
    const start = end - days * 24 * 60 * 60 * 1000;
    setDateRange({ start, end });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setDateRange((prev) => ({ ...prev, start: date.getTime() }));
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    date.setHours(23, 59, 59, 999);
    setDateRange((prev) => ({ ...prev, end: date.getTime() }));
  };

  const formatDateForInput = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
  };

  // Calculate stats
  const totalTrainings = trainings.length;

  // Average training duration in minutes
  const avgDuration = totalTrainings > 0
    ? Math.round(trainings.reduce((sum, t) => sum + (t.endTime - t.startTime), 0) / totalTrainings / 1000 / 60)
    : 0;

  // Unique exercises count
  const uniqueExercises = new Set(sets.map(s => s.exerciseId)).size;

  const durationInDays = Math.max(1, (dateRange.end - dateRange.start) / (24 * 60 * 60 * 1000));
  const durationInWeeks = durationInDays / 7;
  const trainingsPerWeek = durationInWeeks > 0 ? (totalTrainings / durationInWeeks).toFixed(1) : '0';

  // Exercise leaderboard
  const exerciseCountMap = new Map<string, number>();
  sets.forEach((set) => {
    const count = exerciseCountMap.get(set.exerciseId) || 0;
    exerciseCountMap.set(set.exerciseId, count + 1);
  });

  const exerciseLeaderboard = Array.from(exerciseCountMap.entries())
    .map(([exerciseId, count]) => {
      const exercise = exercises.find((e) => e.id === exerciseId);
      return {
        exercise: exercise?.name || 'Unknown',
        bodyPart: exercise?.bodyPart,
        count,
      };
    })
    .sort((a, b) => b.count - a.count);

  const copyToClipboard = async () => {
    // Sort trainings by start time
    const sortedTrainings = [...trainings].sort((a, b) => a.startTime - b.startTime);
    
    let markdown = `# Training Log Export\n\n`;
    markdown += `**Date Range:** ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}\n\n`;
    markdown += `**Total Trainings:** ${totalTrainings}\n\n`;
    markdown += `---\n\n`;

    sortedTrainings.forEach((training, index) => {
      const duration = Math.round((training.endTime - training.startTime) / 1000 / 60);
      const date = new Date(training.startTime);
      
      markdown += `## Training ${index + 1}: ${training.name || 'Workout'}\n\n`;
      markdown += `**Date:** ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}\n\n`;
      markdown += `**Duration:** ${duration} minutes\n\n`;
      
      if (training.warmUp) {
        markdown += `**Warm-up:** ${training.warmUp}\n\n`;
      }
      
      if (training.calmDown) {
        markdown += `**Cool-down:** ${training.calmDown}\n\n`;
      }

      // Get sets for this training
      const trainingSets = sets.filter(s => s.trainingId === training.id)
        .sort((a, b) => a.orderInTraining - b.orderInTraining);

      if (trainingSets.length > 0) {
        markdown += `**Exercises:**\n\n`;
        
        trainingSets.forEach((set, setIndex) => {
          const exercise = exercises.find(e => e.id === set.exerciseId);
          const setRounds = rounds.filter(r => r.setId === set.id)
            .sort((a, b) => a.orderInSet - b.orderInSet);
          
          markdown += `${setIndex + 1}. **${exercise?.name || 'Unknown Exercise'}**`;
          if (exercise?.bodyPart) {
            markdown += ` (${exercise.bodyPart})`;
          }
          markdown += `\n`;
          
          if (setRounds.length > 0) {
            markdown += `   - Sets: ${setRounds.length}\n`;
            markdown += `   - Rounds:\n`;
            setRounds.forEach((round, roundIndex) => {
              markdown += `     - Round ${roundIndex + 1}: ${round.reps} reps`;
              if (round.weight > 0) {
                markdown += ` @ ${round.weight}${exercise?.weightUnit || 'kg'}`;
              }
              if (round.notes) {
                markdown += ` (${round.notes})`;
              }
              markdown += `\n`;
            });
          }
          
          if (set.restPeriod) {
            markdown += `   - Rest: ${set.restPeriod}s\n`;
          }
          
          if (set.notes) {
            markdown += `   - Notes: ${set.notes}\n`;
          }
          
          markdown += `\n`;
        });
      }

      if (training.notes) {
        markdown += `**Notes:** ${training.notes}\n\n`;
      }

      markdown += `---\n\n`;
    });

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pt-5">
      <div className="flex items-center gap-2 mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Statistics</h1>
      </div>
      <p className="text-muted-foreground mb-6 ml-12">{userName}'s progress overview</p>

      {/* Date Range Selection */}
      <Card size="sm" className="mb-6">
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium block mb-1">Start Date</label>
              <Input
                type="date"
                value={formatDateForInput(dateRange.start)}
                onChange={handleStartDateChange}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">End Date</label>
              <Input
                type="date"
                value={formatDateForInput(dateRange.end)}
                onChange={handleEndDateChange}
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => setPreset(7)}>
              Last 7 days
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPreset(30)}>
              Last 30 days
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPreset(90)}>
              Last 3 months
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPreset(365)}>
              Last year
            </Button>
          </div>
          <div className="pt-2 border-t">
            <Button 
              size="sm" 
              variant="default" 
              onClick={copyToClipboard}
              className="w-full"
              disabled={totalTrainings === 0}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Training Log
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overall Stats */}
      <Card size="sm" className="mb-6">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Trainings</p>
              <p className="text-2xl font-bold">{totalTrainings}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Trainings/Week</p>
              <p className="text-2xl font-bold">{trainingsPerWeek}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Duration</p>
              <p className="text-2xl font-bold">{avgDuration}<span className="text-sm ml-1">min</span></p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Different Exercises</p>
              <p className="text-2xl font-bold">{uniqueExercises}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Leaderboard */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Exercise Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {exerciseLeaderboard.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No exercises in this time range
            </p>
          ) : (
            <div className="space-y-2">
              {exerciseLeaderboard.map((item, index) => (
                <div
                  key={item.exercise}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{item.exercise}</p>
                      {item.bodyPart && (
                        <p className="text-xs text-muted-foreground">{item.bodyPart}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{item.count}</p>
                    <p className="text-xs text-muted-foreground">sets</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
