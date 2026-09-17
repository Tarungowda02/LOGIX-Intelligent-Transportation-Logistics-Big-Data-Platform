package com.logix.mapreduce;

import java.io.IOException;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

public class RoutePerformanceAnalysis {

    // =========================================================
    // MAPPER
    // =========================================================
    public static class RouteMapper
            extends Mapper<LongWritable, Text, Text, Text> {

        private final Text routeId = new Text();
        private final Text outputValue = new Text();

        @Override
        protected void map(
                LongWritable key,
                Text value,
                Context context)
                throws IOException, InterruptedException {

            String line = value.toString().trim();

            // Skip CSV header
            if (line.startsWith("route_id")) {
                return;
            }

            String[] fields = line.split(",", -1);

            /*
             * Actual routes.csv schema:
             *
             * 0 route_id
             * 1 origin
             * 2 destination
             * 3 distance_km
             * 4 historical_delay_rate
             * 5 average_speed
             * 6 route_rating
             */

            if (fields.length < 7) {
                return;
            }

            String id = fields[0].trim();
            String origin = fields[1].trim();
            String destination = fields[2].trim();

            try {

                double distance =
                        Double.parseDouble(fields[3].trim());

                double delayRate =
                        Double.parseDouble(fields[4].trim());

                double averageSpeed =
                        Double.parseDouble(fields[5].trim());

                double rating =
                        Double.parseDouble(fields[6].trim());

                String result =
                        origin + ","
                        + destination + ","
                        + distance + ","
                        + delayRate + ","
                        + averageSpeed + ","
                        + rating;

                routeId.set(id);
                outputValue.set(result);

                context.write(
                        routeId,
                        outputValue
                );

            } catch (NumberFormatException e) {
                // Ignore malformed records
            }
        }
    }

    // =========================================================
    // REDUCER
    // =========================================================
    public static class RouteReducer
            extends Reducer<Text, Text, Text, Text> {

        @Override
        protected void reduce(
                Text key,
                Iterable<Text> values,
                Context context)
                throws IOException, InterruptedException {

            for (Text value : values) {

                String[] fields =
                        value.toString().split(",", -1);

                if (fields.length < 6) {
                    continue;
                }

                String origin = fields[0];
                String destination = fields[1];

                double distance =
                        Double.parseDouble(fields[2]);

                double delayRate =
                        Double.parseDouble(fields[3]);

                double averageSpeed =
                        Double.parseDouble(fields[4]);

                double rating =
                        Double.parseDouble(fields[5]);

                /*
                 * ROUTE EFFICIENCY SCORE
                 *
                 * Rating contribution:       40 points
                 * Delay contribution:        30 points
                 * Speed contribution:        20 points
                 * Distance contribution:     10 points
                 *
                 * Maximum = 100
                 */

                double ratingScore =
                        Math.min(40.0, rating * 8.0);

                double delayScore =
                        Math.max(
                                0,
                                30.0 - (delayRate * 1.5)
                        );

                double speedScore =
                        Math.min(
                                20.0,
                                averageSpeed * 0.30
                        );

                double distanceScore;

                if (distance <= 300) {
                    distanceScore = 10.0;
                } else if (distance <= 500) {
                    distanceScore = 8.0;
                } else if (distance <= 700) {
                    distanceScore = 6.0;
                } else {
                    distanceScore = 4.0;
                }

                double efficiencyScore =
                        ratingScore
                        + delayScore
                        + speedScore
                        + distanceScore;

                efficiencyScore =
                        Math.max(
                                0,
                                Math.min(
                                        100,
                                        efficiencyScore
                                )
                        );

                String efficiencyLevel;

                if (efficiencyScore >= 80) {
                    efficiencyLevel = "Excellent";
                } else if (efficiencyScore >= 60) {
                    efficiencyLevel = "Good";
                } else if (efficiencyScore >= 40) {
                    efficiencyLevel = "Moderate";
                } else {
                    efficiencyLevel = "Poor";
                }

                /*
                 * ROUTE RISK
                 */

                String riskLevel;

                if (delayRate >= 20) {
                    riskLevel = "High";
                } else if (delayRate >= 15) {
                    riskLevel = "Moderate";
                } else {
                    riskLevel = "Low";
                }

                String result =
                        "origin=" + origin
                        + ", destination=" + destination
                        + ", distance_km="
                        + String.format("%.0f", distance)
                        + ", historical_delay_rate="
                        + String.format("%.2f", delayRate)
                        + ", average_speed="
                        + String.format("%.2f", averageSpeed)
                        + ", route_rating="
                        + String.format("%.2f", rating)
                        + ", efficiency_score="
                        + String.format("%.2f", efficiencyScore)
                        + ", efficiency_level="
                        + efficiencyLevel
                        + ", risk_level="
                        + riskLevel;

                context.write(
                        key,
                        new Text(result)
                );
            }
        }
    }

    // =========================================================
    // DRIVER
    // =========================================================
    public static void main(String[] args)
            throws Exception {

        if (args.length != 2) {

            System.err.println(
                    "Usage: RoutePerformanceAnalysis <input> <output>"
            );

            System.exit(2);
        }

        Configuration conf =
                new Configuration();

        Job job =
                Job.getInstance(
                        conf,
                        "LOGIX Route Performance Analysis"
                );

        job.setJarByClass(
                RoutePerformanceAnalysis.class
        );

        job.setMapperClass(
                RouteMapper.class
        );

        job.setReducerClass(
                RouteReducer.class
        );

        job.setMapOutputKeyClass(
                Text.class
        );

        job.setMapOutputValueClass(
                Text.class
        );

        job.setOutputKeyClass(
                Text.class
        );

        job.setOutputValueClass(
                Text.class
        );

        FileInputFormat.addInputPath(
                job,
                new Path(args[0])
        );

        FileOutputFormat.setOutputPath(
                job,
                new Path(args[1])
        );

        System.exit(
                job.waitForCompletion(true)
                        ? 0
                        : 1
        );
    }
}
