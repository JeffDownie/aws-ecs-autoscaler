# AWS ECS Autoscaler

[![Build Status](https://img.shields.io/travis/JeffDownie/aws-ecs-autoscaler/master.svg)](https://travis-ci.org/JeffDownie/aws-ecs-autoscaler?branch=master) [![Coverage Status](https://img.shields.io/coveralls/JeffDownie/aws-ecs-autoscaler/master.svg)](https://coveralls.io/github/JeffDownie/aws-ecs-autoscaler?branch=master) [![Npm Version](https://img.shields.io/npm/v/aws-ecs-autoscaler.svg)](https://www.npmjs.com/package/aws-ecs-autoscaler)

The AWS ECS Autoscaler keeps track of the cpu and memory requirements of the services running in an ECS cluster, and adjusts the desired capacity of the underlying AWS autoscaling group to minimize wastage. It can be run as a task in the ECS cluster itself, or on a separate management server.

## Usage

In a cloudformation template, on the ECS cluster:
```yaml
  Service:
    Properties:
      Cluster: my-cluster-name
      DesiredCount: 2
      TaskDefinition: !Ref AutoscalingTaskDefinition
    Type: AWS::ECS::Service

  AutoscalingTaskDefinition:
    Properties:
      ContainerDefinitions:
      - Environment:
        - Name: AS_GROUP_NAME
          Value: MY_AUSTOSCALING_GROUP_NAME
        - Name: CLUSTER_NAME
          Value: MY_CLUSTER_NAME
        - Name: AWS_REGION
          Value: !Ref "AWS::Region"
        Essential: true
        Image: !Sub trinitymirror/aws-ecs-autoscaler:${AutoscalingVersion}
        Memory: 200
        Cpu: 100
        Name: Autoscaler
    Type: AWS::ECS::TaskDefinition
```

And it would require the following permissions attached to the Austoscaling group's launch configuration iam role to run:

```yaml
- Action:
  - autoscaling:DescribeAutoScalingGroups
  - autoscaling:SetDesiredCapacity
  - autoscaling:TerminateInstanceInAutoScalingGroup
  Effect: Allow
  Resource: '*'
- Action:
  - ecs:DescribeContainerInstances
  - ecs:DescribeServices
  - ecs:DescribeTaskDefinition
  - ecs:DescribeTasks
  - ecs:ListContainerInstances
  - ecs:ListServices
  - ecs:ListTasks
  Effect: Allow
  Resource: '*'
- Action:
  - ec2:DescribeInstances
  Effect: Allow
  Resource: '*'
```

Note that the autoscaling actions do require access to all resources, and cannot be limited to just your autoscaling group - this is a limitation of [AWS autoscaling groups](http://docs.aws.amazon.com/autoscaling/latest/userguide/IAM.html#AutoScaling_ARN_Format)

## Optional environment variables and their defaults:
`DRY_RUN=false` - When true, causes the container to not actually run any changes, just print to stdout what it would do. Default is false.
`INTERVAL=20000` - The interval that the container checks for changes to the cluster, in milliseconds. Default is 20000.
